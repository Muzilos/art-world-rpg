import type { Maps } from '../types/maps';

export const MAPS: Maps = {
  studio: {
    name: 'Artist Studio',
    width: 15,
    height: 15,
    bgm: 'studio_theme',
    tiles: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    objects: {
      '2,2': {
        type: 'easel',
        interaction: 'create_art',
        name: 'Easel'
      },
      '7,2': {
        type: 'computer',
        interaction: 'create_art',
        name: 'Computer'
      },
      '2,6': {
        type: 'bed',
        interaction: 'rest',
        name: 'Bed'
      },
      '7,6': {
        type: 'bookshelf',
        interaction: 'study',
        name: 'Bookshelf'
      },
      '7,0': {
        type: 'gallery_door',
        interaction: 'exit',
        name: 'Gallery Door'
      }
    },
    exits: {
      '7,0': {
        to: 'gallery',
        x: 7,
        y: 1
      }
    }
  },
  gallery: {
    name: "Chelsea Gallery District",
    width: 20,
    height: 20,
    bgm: 'sophisticated',
    tiles: [
      [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 1],
      [1, 7, 8, 8, 8, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 1],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [1, 7, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, 7, 1],
      [1, 7, 8, 8, 8, 2, 2, 2, 8, 8, 8, 8, 8, 2, 2, 2, 8, 8, 7, 1],
      [1, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 7, 7, 2, 2, 2, 7, 7, 7, 1],
      [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1],
      [1, 9, 9, 9, 9, 2, 2, 2, 9, 9, 9, 9, 9, 2, 2, 2, 10, 10, 10, 1],
      [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1],
      [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1],
      [1, 9, 11, 11, 11, 2, 2, 2, 11, 11, 11, 11, 11, 2, 2, 2, 12, 12, 12, 1],
      [1, 9, 9, 9, 9, 2, 2, 2, 9, 9, 9, 9, 9, 2, 2, 2, 10, 10, 10, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    objects: {
      '3,2': {
        type: 'npc_collector',
        name: 'Victoria Sterling',
        interaction: 'talk_npc' // Make sure this is 'talk_npc' not something else
      },
      '10,5': {
        type: 'npc_artist',
        name: 'Jackson Park',
        interaction: 'talk_npc'
      },
      '6,10': {
        type: 'npc_critic',
        name: 'Eleanor Sharp',
        interaction: 'talk_npc'
      },
      '15,7': {
        type: 'npc_gallerist',
        name: 'Marcus Chen',
        interaction: 'talk_npc'
      },
      '12,8': {
        type: 'npc_influencer',
        name: 'Luna Vega',
        interaction: 'talk_npc'
      },
      '8,12': {
        type: 'npc_dealer',
        name: 'Rico Martinez',
        interaction: 'talk_npc'
      },
      '4,8': {
        type: 'npc_historian',
        name: 'Dr. Elizabeth Black',
        interaction: 'talk_npc'
      },
      '16,12': {
        type: 'npc_curator',
        name: 'Sophia Chen',
        interaction: 'talk_npc'
      },
      '5,15': {
        type: 'gallery_door',
        name: 'Pace Gallery',
        interaction: 'enter_gallery_pace'
      },
      '16,15': {
        type: 'gallery_door',
        name: 'Rising Stars Gallery',
        interaction: 'enter_gallery_rising'
      },
      '10,3': {
        type: 'info_board',
        interaction: 'check_events',
        name: 'Events Board'
      },
      '7,1': {
        type: 'studio_door',
        interaction: 'exit',
        name: 'Studio Door'
      },
      '0,6': {
        type: 'brooklyn_door',
        interaction: 'exit',
        name: 'Brooklyn Door'
      },
      '0,7': {
        type: 'brooklyn_door',
        interaction: 'exit',
        name: 'Brooklyn Door'
      },
      '19,7': {
        type: 'soho_door',
        interaction: 'exit',
        name: 'SoHo Door'
      },
      '19,8': {
        type: 'soho_door',
        interaction: 'exit',
        name: 'SoHo Door'
      }
    },
    exits: {
      '7,1': {
        to: 'studio',
        x: 7,
        y: 1
      },
      '0,6': {
        to: 'brooklyn',
        x: 18,
        y: 6
      },
      '0,7': {
        to: 'brooklyn',
        x: 18,
        y: 7
      },
      '19,7': {
        to: 'soho',
        x: 1,
        y: 6
      },
      '19,8': {
        to: 'soho',
        x: 1,
        y: 7
      }
    }
  },
  brooklyn: {
    name: "Brooklyn Art Scene",
    width: 20,
    height: 15,
    bgm: 'indie',
    locked: true,
    unlockReq: { reputation: 25 },
    tiles: [
      [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
      [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13],
      [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 13],
      [13, 14, 2, 15, 15, 15, 2, 2, 2, 2, 2, 2, 2, 16, 16, 16, 2, 2, 14, 13],
      [13, 14, 2, 15, 2, 15, 2, 2, 2, 2, 2, 2, 2, 16, 2, 16, 2, 2, 14, 13],
      [13, 14, 2, 15, 15, 15, 2, 2, 2, 2, 2, 2, 2, 16, 16, 16, 2, 2, 14, 13],
      [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 0],
      [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 0],
      [13, 14, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 14, 13],
      [13, 14, 2, 17, 17, 17, 2, 2, 2, 2, 2, 2, 2, 18, 18, 18, 2, 2, 14, 13],
      [13, 14, 2, 17, 2, 17, 2, 2, 2, 2, 2, 2, 2, 18, 2, 18, 2, 2, 14, 13],
      [13, 14, 2, 17, 17, 17, 2, 2, 2, 2, 2, 2, 2, 18, 18, 18, 2, 2, 14, 13],
      [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13],
      [13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13],
      [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]
    ],
    objects: {
      '4,9': {
        type: 'warehouse_studio',
        name: 'Bushwick Collective Studio',
        interaction: 'enter_warehouse'
      },
      '14,3': {
        type: 'coffee_shop',
        name: 'Grindhouse Coffee',
        interaction: 'buy_coffee'
      },
      '4,3': {
        type: 'street_vendor',
        name: 'Street Art Supplies',
        interaction: 'buy_supplies'
      },
      '14,9': {
        type: 'thrift_store',
        name: 'Beacon\'s Closet (ish)',
        interaction: 'shop_thrift_store'
      },
      '9,6': {
        type: 'npc_hipster',
        name: 'Ezra Moon',
        interaction: 'talk_npc'
      },
      '7,2': {
        type: 'npc_muralist',
        name: 'Maya Rodriguez',
        interaction: 'talk_npc'
      },
      '19,6': {
        type: 'gallery_door',
        interaction: 'exit',
        name: 'Gallery Door'
      },
      '19,7': {
        type: 'gallery_door',
        interaction: 'exit',
        name: 'Gallery Door'
      }
    },
    exits: {
      '19,6': {
        to: 'gallery',
        x: 1,
        y: 6
      },
      '19,7': {
        to: 'gallery',
        x: 1,
        y: 7
      }
    }
  },
  soho: {
    name: "SoHo Shopping District",
    width: 20,
    height: 15,
    bgm: 'upbeat',
    locked: true,
    unlockReq: { money: 2000 },
    tiles: [
      [19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],
      [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
      [19, 20, 21, 21, 21, 2, 2, 2, 2, 2, 2, 21, 21, 21, 2, 2, 2, 2, 20, 19],
      [0, 20, 21, 22, 21, 2, 2, 2, 2, 2, 2, 21, 23, 21, 2, 2, 2, 2, 20, 19],
      [0, 20, 21, 21, 21, 2, 2, 2, 2, 2, 2, 21, 21, 21, 2, 2, 2, 2, 20, 19],
      [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19],
      [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19],
      [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19],
      [19, 20, 24, 24, 24, 2, 2, 2, 2, 2, 2, 25, 25, 25, 2, 2, 2, 2, 20, 19],
      [19, 20, 24, 22, 24, 2, 2, 2, 2, 2, 2, 25, 22, 25, 2, 2, 2, 2, 20, 19],
      [19, 20, 24, 24, 24, 2, 2, 2, 2, 2, 2, 25, 25, 25, 2, 2, 2, 2, 20, 19],
      [19, 20, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 20, 19],
      [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
      [19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
      [19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19]
    ],
    objects: {
      '3,3': {
        type: 'luxury_gallery',
        name: 'Gagosian Gallery (esque)',
        interaction: 'enter_luxury_gallery'
      },
      '12,3': {
        type: 'art_supply_pro',
        name: 'Pro Art Supplies',
        interaction: 'buy_supplies'
      },
      '3,9': {
        type: 'fashion_boutique',
        name: 'Chic Boutique',
        interaction: 'shop_fashion_boutique'
      },
      '12,9': {
        type: 'wine_bar',
        name: 'The Velvet Rope Wine Bar',
        interaction: 'network_wine_bar'
      },
      '8,6': {
        type: 'npc_influencer',
        name: 'Chloe Kim',
        interaction: 'talk_npc'
      },
      '6,11': {
        type: 'npc_dealer',
        name: 'Philippe Dubois',
        interaction: 'talk_npc'
      },
      '0,6': {
        type: 'gallery_door',
        interaction: 'exit',
        name: 'Gallery Door'
      },
      '0,7': {
        type: 'gallery_door',
        interaction: 'exit',
        name: 'Gallery Door'
      }
    },
    exits: {
      '0,6': {
        to: 'gallery',
        x: 18,
        y: 7
      },
      '0,7': {
        to: 'gallery',
        x: 18,
        y: 8
      }
    }
  }
}; 