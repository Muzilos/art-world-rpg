import asyncio
import json
import time
import random
import re
import os
import shutil
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import anthropic

@dataclass
class GameState:
    """Represents the current state of the game"""
    player_position: tuple
    current_map: str
    money: int
    energy: int
    health: int
    inventory: Dict[str, int]
    skills: Dict[str, Dict[str, Any]]
    active_quests: List[str]
    completed_actions: List[str]
    session_duration: float
    
@dataclass
class GameExperience:
    """Represents an experience or observation from gameplay"""
    timestamp: float
    action_taken: str
    state_before: GameState
    state_after: GameState
    outcome: str
    satisfaction_score: int  # 1-10
    learning: str
    improvement_suggestions: List[str]

@dataclass
class CodeModification:
    """Represents a code change made to the game"""
    file_path: str
    change_type: str  # 'addition', 'modification', 'replacement'
    original_code: str
    new_code: str
    description: str
    success: bool
    timestamp: float

class GameFileManager:
    """Manages reading, writing, and backing up game files"""
    
    def __init__(self, game_directory: str = "."):
        self.game_directory = game_directory
        self.backup_directory = os.path.join(game_directory, "backups")
        self.ensure_backup_directory()
        
    def ensure_backup_directory(self):
        """Create backup directory if it doesn't exist"""
        os.makedirs(self.backup_directory, exist_ok=True)
    
    def backup_file(self, file_path: str) -> str:
        """Create a backup of a file before modifying it"""
        if not os.path.exists(file_path):
            return None
            
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(file_path)
        backup_path = os.path.join(self.backup_directory, f"{filename}_{timestamp}.backup")
        
        try:
            shutil.copy2(file_path, backup_path)
            print(f"Backed up {file_path} to {backup_path}")
            return backup_path
        except Exception as e:
            print(f"Error backing up {file_path}: {e}")
            return None
    
    def read_file(self, file_path: str) -> Optional[str]:
        """Read the contents of a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return None
    
    def write_file(self, file_path: str, content: str) -> bool:
        """Write content to a file"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully wrote to {file_path}")
            return True
        except Exception as e:
            print(f"Error writing to {file_path}: {e}")
            return False
    
    def modify_file(self, file_path: str, modification: CodeModification) -> bool:
        """Apply a code modification to a file"""
        content = self.read_file(file_path)
        if content is None:
            return False
        
        # Backup before modifying
        backup_path = self.backup_file(file_path)
        if backup_path is None:
            print(f"Failed to backup {file_path}, skipping modification")
            return False
        
        try:
            if modification.change_type == 'addition':
                # Add new code at the end of the file
                new_content = content + '\n\n' + modification.new_code
            elif modification.change_type == 'replacement':
                # Replace specific code section
                if modification.original_code in content:
                    new_content = content.replace(modification.original_code, modification.new_code)
                else:
                    print(f"Original code not found in {file_path}")
                    return False
            elif modification.change_type == 'insertion':
                # Insert code at a specific location (e.g., before closing brace)
                new_content = self._insert_code_smartly(content, modification.new_code, file_path)
            else:
                print(f"Unknown modification type: {modification.change_type}")
                return False
            
            return self.write_file(file_path, new_content)
            
        except Exception as e:
            print(f"Error modifying {file_path}: {e}")
            return False
    
    def _insert_code_smartly(self, content: str, new_code: str, file_path: str) -> str:
        """Insert code at an appropriate location based on file type"""
        if file_path.endswith('.js'):
            # For JS files, try to insert before the last closing brace
            lines = content.split('\n')
            
            # Find the best insertion point
            if 'state.js' in file_path:
                # Insert new properties in gameState object
                for i, line in enumerate(lines):
                    if 'gameState = {' in line:
                        # Find the closing brace of gameState
                        brace_count = 0
                        for j in range(i, len(lines)):
                            brace_count += lines[j].count('{') - lines[j].count('}')
                            if brace_count == 0 and '}' in lines[j]:
                                lines.insert(j, new_code)
                                break
                        break
            elif 'entities.js' in file_path:
                # Insert before the last closing of entities object
                lines.insert(-2, new_code)
            else:
                # Default: insert before the last non-empty line
                for i in range(len(lines) - 1, -1, -1):
                    if lines[i].strip():
                        lines.insert(i + 1, new_code)
                        break
                        
            return '\n'.join(lines)
        
        elif file_path.endswith('.css'):
            # For CSS files, append at the end
            return content + '\n\n' + new_code
        
        return content + '\n\n' + new_code

class RPGGameController:
    """Controls the browser and interacts with the RPG game"""
    
    def __init__(self, game_url: str = "http://localhost:8000"):
        self.game_url = game_url
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """Initialize the Chrome WebDriver"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1200,800")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        self.driver = webdriver.Chrome(options=chrome_options)
        
    def load_game(self):
        """Load the RPG game page"""
        print(f"Loading game from {self.game_url}")
        self.driver.get(self.game_url)
        time.sleep(3)  # Wait for game to load
        
    def reload_game(self):
        """Reload the game to apply code changes"""
        print("Reloading game to apply changes...")
        self.driver.refresh()
        time.sleep(3)  # Wait for reload
        
    def get_game_state(self) -> GameState:
        """Extract current game state from the browser"""
        try:
            # Get money
            money_text = self.driver.find_element(By.ID, "moneyText").text
            money = int(money_text.replace('$', ''))
            
            # Get energy
            energy_text = self.driver.find_element(By.ID, "energyText").text
            energy_parts = energy_text.split('/')
            energy = int(energy_parts[0])
            
            # Get health
            hp_text = self.driver.find_element(By.ID, "hpText").text
            hp_parts = hp_text.split('/')
            health = int(hp_parts[0])
            
            # Get inventory
            inventory = {}
            backpack_items = self.driver.find_elements(By.CLASS_NAME, "backpack-item")
            for item in backpack_items:
                item_text = item.text
                if '(' in item_text and ')' in item_text:
                    name = item_text.split('(')[0].strip().lower().replace(' ', '_')
                    quantity = int(item_text.split('(')[1].split(')')[0])
                else:
                    name = item_text.strip().lower().replace(' ', '_')
                    quantity = 1
                inventory[name] = quantity
            
            # Get skills
            skills = {}
            skill_rows = self.driver.find_elements(By.CLASS_NAME, "skill-row")
            for row in skill_rows:
                try:
                    skill_name_elem = row.find_element(By.CLASS_NAME, "skill-name")
                    skill_level_elem = row.find_element(By.CLASS_NAME, "skill-level")
                    
                    skill_name = skill_name_elem.text.split()[-1]  # Get abbreviation
                    skill_level = int(skill_level_elem.text.replace('L', ''))
                    
                    skills[skill_name] = {
                        'level': skill_level,
                        'xp': 0
                    }
                except:
                    continue
            
            return GameState(
                player_position=(0, 0),
                current_map="art_district",
                money=money,
                energy=energy,
                health=health,
                inventory=inventory,
                skills=skills,
                active_quests=[],
                completed_actions=[],
                session_duration=0.0
            )
        except Exception as e:
            print(f"Error extracting game state: {e}")
            return None
    
    def click_at_position(self, x: int, y: int):
        """Click at a specific position on the game canvas"""
        try:
            canvas = self.driver.find_element(By.ID, "gameCanvas")
            ActionChains(self.driver).move_to_element_with_offset(canvas, x, y).click().perform()
            time.sleep(1)
        except Exception as e:
            print(f"Error clicking at position ({x}, {y}): {e}")
    
    def interact_with_dialogue(self, option_index: int = 0):
        """Interact with dialogue by selecting an option"""
        try:
            dialogue_box = self.driver.find_element(By.ID, "dialogueBox")
            if "hidden" not in dialogue_box.get_attribute("class"):
                options = self.driver.find_elements(By.CLASS_NAME, "dialogue-option")
                if options and option_index < len(options):
                    options[option_index].click()
                    time.sleep(1)
                    return True
        except Exception as e:
            print(f"Error interacting with dialogue: {e}")
        return False
    
    def craft_item(self, item_type: str):
        """Attempt to craft an item"""
        try:
            craft_button = self.driver.find_element(By.ID, f"craft_{item_type}")
            craft_button.click()
            time.sleep(2)
            return True
        except Exception as e:
            print(f"Error crafting {item_type}: {e}")
            return False
    
    def check_for_errors(self) -> List[str]:
        """Check browser console for JavaScript errors"""
        try:
            logs = self.driver.get_log('browser')
            errors = []
            for log in logs:
                if log['level'] == 'SEVERE':
                    errors.append(log['message'])
            return errors
        except:
            return []
    
    def close(self):
        """Close the browser driver"""
        if self.driver:
            self.driver.quit()

class AIGameAgent:
    """AI agent that plays the RPG, learns, and implements improvements"""
    
    def __init__(self, anthropic_api_key: str, game_directory: str = "."):
        self.controller = RPGGameController()
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.file_manager = GameFileManager(game_directory)
        self.experiences: List[GameExperience] = []
        self.modifications: List[CodeModification] = []
        self.session_start = time.time()
        
    def think_about_state(self, current_state: GameState) -> str:
        """Use AI to analyze current game state and decide next action"""
        state_description = f"""
Current Game State:
- Money: ${current_state.money}
- Energy: {current_state.energy}
- Health: {current_state.health}
- Inventory: {current_state.inventory}
- Skills: {current_state.skills}
- Map: {current_state.current_map}

Recent experiences: {len(self.experiences)} actions taken
Modifications made: {len(self.modifications)}
Session duration: {time.time() - self.session_start:.1f} seconds
"""
        
        prompt = f"""
You are an AI playing an Art World RPG. Analyze the current state and decide on the next best action.

{state_description}

Consider these goals:
1. Make money to buy supplies
2. Improve artistic skills through practice
3. Complete quests and build relationships
4. Explore different areas
5. Maintain energy levels

What should you do next? Respond with a specific action plan including:
- Primary action to take
- Reasoning behind the decision
- Expected outcome

Keep response concise and actionable.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            print(f"Error getting AI response: {e}")
            return "Explore the current area by clicking randomly."
    
    def execute_action(self, action_plan: str, current_state: GameState) -> str:
        """Execute an action based on the AI's plan"""
        action_taken = "idle"
        
        # Simple action parsing
        if "craft" in action_plan.lower():
            if "sketch" in action_plan.lower():
                if self.controller.craft_item("pencil_sketch"):
                    action_taken = "crafted_pencil_sketch"
            elif "watercolor" in action_plan.lower():
                if self.controller.craft_item("watercolor_painting"):
                    action_taken = "crafted_watercolor_painting"
        
        elif "talk" in action_plan.lower() or "dialogue" in action_plan.lower():
            npc_positions = [(8*32, 8*32), (15*32, 10*32)]
            for pos in npc_positions:
                self.controller.click_at_position(pos[0], pos[1])
                if self.controller.interact_with_dialogue():
                    action_taken = f"talked_to_npc_at_{pos}"
                    break
        
        elif "buy" in action_plan.lower() or "shop" in action_plan.lower():
            self.controller.click_at_position(15*32, 10*32)
            time.sleep(2)
            if self.controller.interact_with_dialogue():
                self.controller.interact_with_dialogue(1)
                action_taken = "visited_shop"
        
        elif "coffee" in action_plan.lower() or "energy" in action_plan.lower():
            self.controller.click_at_position(12*32, 17*32)
            time.sleep(2)
            action_taken = "went_to_coffee_shop"
        
        else:
            x = random.randint(100, 700)
            y = random.randint(100, 500)
            self.controller.click_at_position(x, y)
            action_taken = f"explored_position_{x}_{y}"
        
        return action_taken
    
    def generate_and_implement_improvements(self) -> List[CodeModification]:
        """Generate and implement code improvements based on experiences"""
        if len(self.experiences) < 3:
            return []
        
        # Analyze recent experiences
        recent_experiences = self.experiences[-5:]
        avg_satisfaction = sum(exp.satisfaction_score for exp in recent_experiences) / len(recent_experiences)
        
        # Collect all improvement suggestions
        all_suggestions = []
        for exp in recent_experiences:
            all_suggestions.extend(exp.improvement_suggestions)
        
        prompt = f"""
Based on AI gameplay analysis of an Art World RPG, generate specific code improvements.
Current average satisfaction: {avg_satisfaction:.1f}/10

Recent gameplay patterns:
{chr(10).join([f"- {exp.action_taken}: {exp.outcome} (satisfaction: {exp.satisfaction_score}/10)" for exp in recent_experiences])}

Improvement suggestions from AI:
{chr(10).join(all_suggestions[:5])}

Generate 1-2 specific, small code improvements that can be easily implemented. Focus on:
1. Immediate quality of life improvements
2. Better player feedback
3. Small new features that enhance engagement
4. Bug fixes or balance tweaks

For each improvement, provide:
- File: [filename]
- Type: [addition/replacement/insertion]
- Code: [actual code to add/replace]
- Original: [original code to replace, if replacement]
- Description: [what it does]

Keep changes small and safe. Prefer additions over replacements.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse the response and implement changes
            return self._parse_and_implement_improvements(response.content[0].text)
            
        except Exception as e:
            print(f"Error generating improvements: {e}")
            return []
    
    def _parse_and_implement_improvements(self, ai_response: str) -> List[CodeModification]:
        """Parse AI response and implement the suggested improvements"""
        modifications = []
        
        # Simple parsing - look for File:, Type:, Code:, etc.
        lines = ai_response.split('\n')
        current_mod = {}
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('File:'):
                if current_mod:
                    # Implement previous modification
                    mod = self._create_and_apply_modification(current_mod)
                    if mod:
                        modifications.append(mod)
                current_mod = {'file': line.replace('File:', '').strip()}
                
            elif line.startswith('Type:'):
                current_mod['type'] = line.replace('Type:', '').strip()
                
            elif line.startswith('Code:'):
                current_mod['code'] = line.replace('Code:', '').strip()
                
            elif line.startswith('Original:'):
                current_mod['original'] = line.replace('Original:', '').strip()
                
            elif line.startswith('Description:'):
                current_mod['description'] = line.replace('Description:', '').strip()
                
            elif current_mod.get('code') and line and not line.startswith(('File:', 'Type:', 'Code:', 'Original:', 'Description:')):
                # Continue multiline code
                current_mod['code'] += '\n' + line
        
        # Handle last modification
        if current_mod:
            mod = self._create_and_apply_modification(current_mod)
            if mod:
                modifications.append(mod)
        
        return modifications
    
    def _create_and_apply_modification(self, mod_data: dict) -> Optional[CodeModification]:
        """Create and apply a single code modification"""
        if not all(key in mod_data for key in ['file', 'type', 'code']):
            print(f"Incomplete modification data: {mod_data}")
            return None
        
        file_path = mod_data['file'].replace('js/', '').replace('css/', '')
        if not file_path.startswith(('js/', 'css/')):
            if file_path.endswith('.js'):
                file_path = 'js/' + file_path
            elif file_path.endswith('.css'):
                file_path = 'css/' + file_path
        
        modification = CodeModification(
            file_path=file_path,
            change_type=mod_data['type'],
            original_code=mod_data.get('original', ''),
            new_code=mod_data['code'],
            description=mod_data.get('description', 'AI-generated improvement'),
            success=False,
            timestamp=time.time()
        )
        
        # Apply the modification
        print(f"Applying modification to {file_path}: {modification.description}")
        success = self.file_manager.modify_file(file_path, modification)
        modification.success = success
        
        if success:
            print(f"✅ Successfully applied modification to {file_path}")
            # Reload the game to test changes
            self.controller.reload_game()
            time.sleep(2)
            
            # Check for errors
            errors = self.controller.check_for_errors()
            if errors:
                print(f"⚠️ JavaScript errors detected after modification: {errors}")
        else:
            print(f"❌ Failed to apply modification to {file_path}")
        
        return modification
    
    def reflect_on_experience(self, experience: GameExperience) -> List[str]:
        """Use AI to reflect on an experience and suggest improvements"""
        experience_text = f"""
Action taken: {experience.action_taken}
Outcome: {experience.outcome}
State change: Money {experience.state_before.money} → {experience.state_after.money}
Energy: {experience.state_before.energy} → {experience.state_after.energy}
Satisfaction: {experience.satisfaction_score}/10
"""
        
        prompt = f"""
Analyze this gameplay experience from an Art World RPG:

{experience_text}

Suggest 1-2 specific improvements that would enhance this type of interaction:
- Focus on immediate, implementable changes
- Consider player feedback and engagement
- Think about balance and progression

Keep suggestions brief and specific.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            
            suggestions = []
            lines = response.content[0].text.split('\n')
            for line in lines:
                if line.strip() and ('add' in line.lower() or 'improve' in line.lower() or 'create' in line.lower()):
                    suggestions.append(line.strip())
            
            return suggestions[:2]
        
        except Exception as e:
            print(f"Error reflecting on experience: {e}")
            return ["Improve player feedback", "Add more engaging mechanics"]
    
    async def play_and_improve_session(self, duration_minutes: int = 10, improvement_frequency: int = 3):
        """Play the game and implement improvements periodically"""
        print(f"Starting {duration_minutes}-minute gameplay and improvement session...")
        
        self.controller.load_game()
        session_end = time.time() + (duration_minutes * 60)
        actions_since_improvement = 0
        
        while time.time() < session_end:
            try:
                # Get current state
                current_state = self.controller.get_game_state()
                if not current_state:
                    time.sleep(2)
                    continue
                
                # Think about what to do
                action_plan = self.think_about_state(current_state)
                print(f"AI Decision: {action_plan[:100]}...")
                
                # Execute action
                action_taken = self.execute_action(action_plan, current_state)
                time.sleep(2)
                
                # Get new state
                new_state = self.controller.get_game_state()
                if not new_state:
                    continue
                
                # Evaluate outcome
                money_change = new_state.money - current_state.money
                energy_change = new_state.energy - current_state.energy
                
                outcome = f"Money: {money_change:+d}, Energy: {energy_change:+d}"
                satisfaction = 5
                
                if money_change > 0:
                    satisfaction += 2
                if energy_change < -20:
                    satisfaction -= 1
                if len(new_state.inventory) > len(current_state.inventory):
                    satisfaction += 1
                
                satisfaction = max(1, min(10, satisfaction))
                
                # Create experience
                experience = GameExperience(
                    timestamp=time.time(),
                    action_taken=action_taken,
                    state_before=current_state,
                    state_after=new_state,
                    outcome=outcome,
                    satisfaction_score=satisfaction,
                    learning=action_plan,
                    improvement_suggestions=[]
                )
                
                # Reflect and get suggestions
                suggestions = self.reflect_on_experience(experience)
                experience.improvement_suggestions = suggestions
                
                self.experiences.append(experience)
                print(f"Action: {action_taken}, Outcome: {outcome}, Satisfaction: {satisfaction}/10")
                
                actions_since_improvement += 1
                
                # Implement improvements periodically
                if actions_since_improvement >= improvement_frequency:
                    print("\n🔧 Generating and implementing improvements...")
                    new_modifications = self.generate_and_implement_improvements()
                    self.modifications.extend(new_modifications)
                    actions_since_improvement = 0
                    
                    if new_modifications:
                        print(f"✨ Applied {len(new_modifications)} improvements!")
                        # Give some time for the changes to take effect
                        await asyncio.sleep(3)
                
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"Error during gameplay: {e}")
                await asyncio.sleep(2)
        
        print(f"\nSession complete!")
        print(f"Experiences: {len(self.experiences)}")
        print(f"Modifications: {len(self.modifications)}")
        print(f"Successful modifications: {sum(1 for m in self.modifications if m.success)}")
        
        return self.experiences, self.modifications
    
    def save_session_report(self):
        """Save a detailed report of the session"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"reports/ai_session_report_{timestamp}.json"
        
        report = {
            "session_info": {
                "start_time": self.session_start,
                "duration": time.time() - self.session_start,
                "total_experiences": len(self.experiences),
                "total_modifications": len(self.modifications),
                "successful_modifications": sum(1 for m in self.modifications if m.success)
            },
            "experiences": [asdict(exp) for exp in self.experiences],
            "modifications": [asdict(mod) for mod in self.modifications]
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            print(f"Session report saved to {filename}")
        except Exception as e:
            print(f"Error saving session report: {e}")
    
    def cleanup(self):
        """Clean up resources"""
        self.save_session_report()
        self.controller.close()

async def main():
    """Main function to run the AI agent"""
    load_dotenv()  # Load environment variables from .env file
    # Set your Anthropic API key here
    API_KEY = os.environ.get("ANTHROPIC_API_KEY", "your-anthropic-api-key-here")
    
    if API_KEY == "your-anthropic-api-key-here":
        print("Please set your Anthropic API key in the API_KEY variable")
        return
    
    # Path to your game directory
    GAME_DIRECTORY = "."  # Current directory, adjust as needed
    
    agent = AIGameAgent(API_KEY, GAME_DIRECTORY)
    
    try:
        # Run a gameplay and improvement session
        experiences, modifications = await agent.play_and_improve_session(
            duration_minutes=10,
            improvement_frequency=4  # Implement improvements every 4 actions
        )
        
        print(f"\n🎮 Session Summary:")
        print(f"📊 Total actions: {len(experiences)}")
        print(f"🔧 Modifications attempted: {len(modifications)}")
        print(f"✅ Successful modifications: {sum(1 for m in modifications if m.success)}")
        
        avg_satisfaction = sum(exp.satisfaction_score for exp in experiences) / len(experiences) if experiences else 0
        print(f"😊 Average satisfaction: {avg_satisfaction:.1f}/10")
        
        if modifications:
            print(f"\n🛠️ Applied modifications:")
            for mod in modifications:
                status = "✅" if mod.success else "❌"
                print(f"{status} {mod.file_path}: {mod.description}")
        
    except KeyboardInterrupt:
        print("\nSession interrupted by user")
    finally:
        agent.cleanup()

if __name__ == "__main__":
    asyncio.run(main())