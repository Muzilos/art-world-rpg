// Updated Node.js Server-Side Code (e.g., server.js)

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/update-file', (req, res) => {
  const { filePath, content } = req.body;
  const fullPath = path.join(__dirname, '..', filePath);

  fs.readFile(fullPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('Failed to read file:', err);
      return res.status(500).send('Failed to read file');
    }

    let updatedContent = fileData;

    if (filePath.includes('js/maps.js')) {
      // Logic for maps.js (as previously provided)
      const mapsRegex = /(const\s+maps\s*=\s*{[^}]*})\s*;/s;
      const mapsMatch = updatedContent.match(mapsRegex);

      if (mapsMatch && mapsMatch[1]) {
          const existingMapsObject = mapsMatch[1];
          const newMapDefinition = content;

          // Find the last ']}' of the existing maps object to insert new map
          const lastSquareBracketIndex = existingMapsObject.lastIndexOf(']');
          let insertIndex = -1;

          // Search backwards from the last bracket to find the closing ']' of the last map's 'tiles' array
          // or the 'transitions' array, which marks the end of a map definition.
          // This ensures we append inside the main 'maps' object, not within a nested array.
          let braceCount = 0;
          for (let i = existingMapsObject.length - 1; i >= 0; i--) {
              if (existingMapsObject[i] === '}') braceCount++;
              if (existingMapsObject[i] === '{') braceCount--;
              if (braceCount === 1 && existingMapsObject[i] === ']') { // Found closing bracket of an inner map object, 1 brace for the map itself
                  insertIndex = i + 1; // Insert right after this closing bracket
                  break;
              }
              if (braceCount === 0 && existingMapsObject[i] === '}') { // Found the main closing brace of the 'maps' object
                insertIndex = i; // Insert right before it
                break;
              }
          }

          if (insertIndex !== -1) {
              const beforeInsert = existingMapsObject.substring(0, insertIndex);
              const afterInsert = existingMapsObject.substring(insertIndex);

              // Check if a comma is needed before inserting the new map
              const hasExistingMaps = existingMapsObject.trim().length > (existingMapsObject.indexOf('{') + 1); // Check if content exists inside {}
              const needsComma = hasExistingMaps && !beforeInsert.trim().endsWith(',');

              updatedContent = updatedContent.replace(mapsRegex, `${beforeInsert}${needsComma ? ',' : ''}\n  ${newMapDefinition}\n${afterInsert}`);
          } else {
              console.warn('Could not find suitable insertion point in maps object. Appending raw content.');
              updatedContent += `\n\n// AI ADDED MAP (Fallback)\n${content}`;
          }
      } else {
          console.warn('Could not find existing maps object to append to. Overwriting might occur.');
          updatedContent += `\n\n// AI ADDED MAP (Fallback - No maps object found)\n${content}`;
      }
    } else if (filePath.includes('js/entities.js')) {
        // This regex extracts the targetMapId and the new entity's JSON string
        const pushRegex = /entities\['(.*?)'\]\.push\(({[\s\S]*?})\);/;
        const contentMatch = content.match(pushRegex);

        if (contentMatch && contentMatch[1] && contentMatch[2]) {
            const targetMapId = contentMatch[1];
            const newEntityJsonString = contentMatch[2]; // This is the JSON string of the new entity

            // This regex uses lookbehind and lookahead to precisely capture the content
            // within the target map's entity array [...]
            const mapArrayContentRegex = new RegExp(
                `(?<=(const\\s+entities\\s*=\\s*{[\\s\\S]*?'${targetMapId}'\\s*:\\s*\\[))[\\s\\S]*?(?=\\][\\s\\S]*?};)`,
                's'
            );
            const currentArrayContentMatch = updatedContent.match(mapArrayContentRegex);

            if (currentArrayContentMatch && currentArrayContentMatch[0] !== undefined) {
                let currentArrayContent = currentArrayContentMatch[0].trim();
                let insertedContent = '';

                if (currentArrayContent.length > 0) {
                    // Add a comma if there are existing elements, ensuring proper formatting
                    insertedContent = ',\n    ' + newEntityJsonString.replace(/\n/g, '\n    '); // Indent new entity
                } else {
                    insertedContent = '\n    ' + newEntityJsonString.replace(/\n/g, '\n    '); // Indent for empty array
                }

                // Replace the old array content with new array content + new entity
                updatedContent = updatedContent.replace(
                    mapArrayContentRegex,
                    currentArrayContent + insertedContent
                );
            } else {
                console.warn(`Could not find the array for map ID '${targetMapId}' in entities.js. Appending raw content.`);
                // Fallback: If the specific array isn't found, try to append the push statement to the end
                updatedContent += `\n\n// AI ADDED ENTITY (Fallback)\n${content}`;
            }
        } else {
            console.warn('Could not parse new NPC content from incoming data. Appending raw content.');
            updatedContent += `\n\n// AI ADDED ENTITY (Fallback - Unparsable content)\n${content}`;
        }
    } else if (filePath.includes('js/state.js')) {
      // Logic for state.js quests (as previously provided)
        const questUpdateRegex = /(gameState\.quests\s*=\s*{[^}]*})\s*;/s;
        const questMatch = updatedContent.match(questUpdateRegex);

        if (questMatch && questMatch[1]) {
            const existingQuestsObject = questMatch[1];
            const newQuestSnippet = content;

            // Find the last entry in the quests object to insert the new quest
            const lastEntryRegex = /([a-zA-Z0-9_]+\s*:\s*(?:'[^']*'|"[^"]*'))(?=\s*(?:,)?\s*})/; // Matches last key:value pair before closing }
            const beforeLastEntryRegex = /([a-zA-Z0-9_]+\s*:\s*(?:'[^']*'|"[^"]*'))(?=\s*,)/g; // Matches all key:value pairs followed by a comma

            let matchBeforeLast = null;
            let lastMatchEndIndex = -1;

            // Find the last comma-separated entry
            let tempMatch;
            while ((tempMatch = beforeLastEntryRegex.exec(existingQuestsObject)) !== null) {
                matchBeforeLast = tempMatch;
                lastMatchEndIndex = tempMatch.index + tempMatch[0].length;
            }

            const lastEntryMatch = existingQuestsObject.match(lastEntryRegex);

            if (lastEntryMatch || matchBeforeLast) {
                let insertionPoint = -1;
                if (lastEntryMatch) {
                    // Insert before the last closing brace '}' of the quests object
                    insertionPoint = existingQuestsObject.lastIndexOf('}');
                } else if (matchBeforeLast) {
                    // Insert after the last comma-separated entry
                    insertionPoint = lastMatchEndIndex;
                }

                if (insertionPoint !== -1) {
                    const beforeInsert = existingQuestsObject.substring(0, insertionPoint);
                    const afterInsert = existingQuestsObject.substring(insertionPoint);

                    const needsComma = !beforeInsert.trim().endsWith('{') && !beforeInsert.trim().endsWith(',');

                    updatedContent = updatedContent.replace(
                        questUpdateRegex,
                        `${beforeInsert}${needsComma ? ',' : ''}\n    ${newQuestSnippet.trim()}\n${afterInsert}`
                    );
                } else {
                    console.warn('Could not find specific insertion point in quests object.');
                    updatedContent += `\n\n// AI ADDED STATE CONTENT (Fallback)\n${content}`;
                }
            } else {
                // If no existing quests, insert directly into the object (e.g., quests: {})
                const emptyObjectRegex = /(gameState\.quests\s*=\s*{)\s*}/;
                updatedContent = updatedContent.replace(emptyObjectRegex, `$1\n    ${newQuestSnippet.trim()}\n  }`);
            }
        } else {
            console.warn('Could not find existing gameState.quests object to modify.');
            updatedContent += `\n\n// AI ADDED STATE CONTENT (Fallback - No quests object found)\n${content}`;
        }
    } else {
      console.warn(`No specific modification logic for ${filePath}. Appending raw content.`);
      updatedContent += `\n\n// AI ADDED CONTENT (Unhandled File Type)\n${content}`;
    }

    fs.writeFile(fullPath, updatedContent, 'utf8', (err) => {
      if (err) {
        console.error('Failed to write file:', err);
        return res.status(500).send('Failed to write file');
      }
      res.send('File updated successfully');
    });
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));