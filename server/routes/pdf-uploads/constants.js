/**
 * Transaction parsing examples and category taxonomy for AI-powered statement analysis
 * These examples are used for few-shot learning to improve transaction categorization accuracy
 */

// Comprehensive category taxonomy with descriptions, keywords, and example merchants
export const CATEGORY_TAXONOMY = {
  Groceries: {
    description: 'Grocery stores, farmers markets, and food retailers',
    keywords: ['grocery', 'supermarket', 'market', 'food', 'produce', 'whole foods', 'organic'],
    merchants: ['ALDI', 'CUB FOODS', 'WHOLE FOODS', 'TRADER JOES', 'SAFEWAY', 'KROGER'],
    examples: [
      { merchant: 'ALDI', amount: 50.99 },
      { merchant: 'CUB FOODS', amount: 46.43 }
    ]
  },
  Dining: {
    description: 'Restaurants, bars, cafes, food delivery, and fast food',
    keywords: ['restaurant', 'cafe', 'bar', 'diner', 'pizza', 'doordash', 'uber eats', 'brewery', 'bistro'],
    merchants: ['TST*RED RABBIT', 'DD *DOORDASH', 'DOORDASH', 'UBER EATS', 'GRUBHUB', 'PUNCH PIZZA', 'BARBETTE', 'LYNLAKE BREWERY'],
    examples: [
      { merchant: 'TST*RED RABBIT', amount: 121.79 },
      { merchant: 'DD *DOORDASH', amount: 56.51 }
    ]
  },
  'Transportation': {
    description: 'Rideshare, parking, gas, tolls, public transit, and vehicle services',
    keywords: ['uber', 'lyft', 'parking', 'gas', 'fuel', 'transit', 'parking meter', 'toll'],
    merchants: ['UBER *TRIP', 'LYFT', 'ONSTREET', 'SPEEDWAY', 'BP', 'SHELL', 'PARKING'],
    examples: [
      { merchant: 'ONSTREET', amount: 6.25 },
      { merchant: 'SPEEDWAY', amount: 51.40 }
    ]
  },
  Subscriptions: {
    description: 'Streaming services, software subscriptions, memberships, and recurring payments',
    keywords: ['subscription', 'netflix', 'spotify', 'apple', 'adobe', 'aws', 'monthly', 'streaming'],
    merchants: ['NETFLIX.COM', 'APPLE.COM/BILL', 'SLING.COM', 'TIDAL.COM', 'OPENAI *CHATGPT', 'ANTHROPIC', 'napster'],
    examples: [
      { merchant: 'NETFLIX.COM', amount: 8.34 },
      { merchant: 'APPLE.COM/BILL', amount: 15.25 },
      { merchant: 'RI *NAPSTER I RHAPSODY', amount: 11.98 },
    ]
  },
  'Healthcare': {
    description: 'Medical services, pharmacies, dental work, vision care, and health professionals',
    keywords: ['pharmacy', 'doctor', 'dental', 'hospital', 'clinic', 'health', 'medical', 'eye', 'vision'],
    merchants: ['ST ANTHONY PARK DENTAL', 'CVS/PHARMACY', 'CAPSULE PHARMACY', 'U OF M-BOYNTON EYE', 'CLINICS', 'SP 10000 INC ->(Magic Mind)', '10016N CLINICS & SURGE'],
    examples: [
      { merchant: 'ST ANTHONY PARK DENTAL', amount: 734.50 },
      { merchant: 'CAPSULE PHARMACY', amount: 23.50 },
      { merchant: 'SP 10000 INC -> (Magic Mind)', amount: 64.60},
      { merchant: '10016N CLINICS & SURGE', amount: 6.00 },

    ]
  },
  Shopping: {
    description: 'Retail stores, online shopping, clothing, home goods, and department stores',
    keywords: ['shop', 'store', 'retail', 'clothing', 'amazon', 'target', 'walmart', 'mall'],
    merchants: ['BARNES & NOBLE', 'WALMART', 'TARGET'],
    examples: [
      { merchant: 'BARNES & NOBLE', amount: 74.06 },
    ]
  },  
  'Home Improvement': {
    description: 'Home goods, furniture, decoration, hardware stores',
    keywords: ['shop', 'store', 'retail', 'furniture', 'hardware'],
    merchants: ['BARNES & NOBLE', 'BRYANT HARDWARE', 'IKEA'],
    examples: [
      { merchant: 'BARNES & NOBLE', amount: 74.06 },
    ]
  },
  Entertainment: {
    description: 'Movies, games, concerts, sporting events, and recreation activities',
    keywords: ['entertainment', 'movie', 'concert', 'game', 'league', 'theater', 'recreation'],
    merchants: ['IN *HELVIG PRODUCTIONS', 'WHOP*ROCKET LEAGUE CLU', 'OPEN STUDIO'],
    examples: [
      { merchant: 'IN *HELVIG PRODUCTIONS', amount: 380.00 },
      { merchant: 'WHOP*ROCKET LEAGUE CLU', amount: 103.95 }
    ]
  },
  Music: {
    description: 'Music streaming, music lessons, instrument maintenance, instrument and equipment shopping, studio and audio services',
    keywords: ['music', 'rhapsody', 'recording', 'tuneMyMusic', 'audio'],
    merchants: ['PAYPAL *TUNEMYMUSIC', 'PBNOIZE', 'RECORDSFIND', 'BANDZOOGLE WEBSITE', 'HELVIG PRODUCTIONS', 'TWIN TOWN GUITARS', 'HOTMART', 'OPEN STUDIO', 'META', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE ADS', 'KIKSTA', 'GROW 360'],
    examples: [
      { merchant: 'PAYPAL *TUNEMYMUSIC', amount: 5.50 },
      { merchant: 'BANDZOOGLE WEBSITE', amount: 199.50 },
      { merchant: 'IN *HELVIG PRODUCTIONS', amount:  380.00 },
      { merchant: 'TWIN TOWN GUITARS', amount: 12.97 },
      { merchant: 'PAYPAL *HOTMART', amount: 107.93 },
      { merchant: 'PP*METAPLATFOR', amount: 14.12 }
    ]
  },
  'Pet Care': {
    description: 'Pet supplies, veterinary services, pet grooming, and pet-related products',
    keywords: ['pet', 'veterinary', 'vet', 'chewy', 'pet supplies', 'grooming', 'animal'],
    merchants: ['CHEWY.COM', 'PETCO', 'PETSMART'],
    examples: [
      { merchant: 'CHEWY.COM', amount: 33.54 }
    ]
  },
  Donations: {
    description: 'Charitable donations, non-profit organizations, and causes',
    keywords: ['donation', 'charity', 'nonprofit', 'non-profit', 'cause', 'foundation'],
    merchants: ['TakeAction Minnesota', 'SOCIAL MEDIA GROWTH'],
    examples: [
      { merchant: 'TakeAction Minnesota', amount: 20.85 }
    ]
  },
  Career: {
    description: 'Career development, job market services',
    keywords: ['education', 'school', 'university', 'course', 'class', 'training', 'learning'],
    merchants: ['ENGLISH FOR CANADA', 'JOBRIGHT.AI', 'LinkedIn'],
    examples: [
      { merchant: 'ENGLISH FOR CANADA', amount: 33.20 },
      { merchant: 'JOBRIGHT.AI', amount: 69.99 },
      { merchant: 'Linkedin P622569446', amount: 196.15 }
    ]
  },
  Utilities: {
    description: 'Electricity, water, gas, internet, and utility bills',
    keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'phone', 'bill'],
    merchants: ['PROGRESSIVE INSU CE', 'Xfinity'],
    examples: [
      { merchant: 'PROGRESSIVE INSU CE', amount: 119.68 }
    ]
  },
  'Professional Services': {
    description: 'Accounting, legal, consulting, design, and other professional services',
    keywords: ['professional', 'service', 'consulting', 'design', 'legal', 'accounting'],
    merchants: [],
    examples: []
  },
  Software: {
    description: 'Software purchases, SaaS platforms, and digital tools',
    keywords: ['software', 'saas', 'app', 'platform', 'service', 'tool', 'workspace'],
    merchants: ['SQSP*', 'VOCALIMAGE.APP'],
    examples: [
      { merchant: 'SQSP*', amount: 18.32 },
      { merchant: 'VOCALIMAGE.APP', amount: 4.99 }
    ]
  },
  'Personal Finance': {
    description: 'Loans, financing, installment payments, and financial services',
    keywords: ['affirm', 'loan', 'finance', 'payment', 'financing'],
    merchants: ['AFFIRM.COM PAYMENTS'],
    examples: [
      { merchant: 'AFFIRM.COM PAYMENTS', amount: 208.24 }
    ]
  }
}

// 104 parsed transaction examples for few-shot learning
// Format: { input: "raw transaction line", output: { date, description, address, amount, category } }
export const PARSING_EXAMPLES = [
  {
    input: '08/30/2025 ONSTREET 8090 33 N 9TH ST MINNEAPOLIS 55454 MN USA 2% $0.13 $6.25',
    output: {
      date: '08/30/2025',
      description: 'ONSTREET',
      address: '33 N 9TH ST MINNEAPOLIS MN 55454',
      amount: 6.25,
      category: 'Transportation'
    }
  },
  {
    input: '08/30/2025 TST*RED RABBIT - MINNE201 N Washington Ave Minneapolis 55401 MN USA 1% $1.22 $121.79',
    output: {
      date: '08/30/2025',
      description: 'TST*RED RABBIT',
      address: '201 N Washington Ave Minneapolis MN 55401',
      amount: 121.79,
      category: 'Dining'
    }
  },
  {
    input: '08/30/2025 IN *HELVIG PRODUCTIONS3880 LINDEN CIR 952-9179189 55331 MN USA 2% $7.60 $380.00',
    output: {
      date: '08/30/2025',
      description: 'IN *HELVIG PRODUCTIONS',
      address: '3880 LINDEN CIR MN 55331',
      amount: 380.00,
      category: 'Music'
    }
  },
  {
    input: '08/31/2025 RI *NAPSTER I RHAPSODY701 5TH AVE STE 3100 206-707-8100 98104 WA USA 1% $0.12 $11.98',
    output: {
      date: '08/31/2025',
      description: 'RI *NAPSTER I RHAPSODY',
      address: '701 5TH AVE STE 3100 WA 98104',
      amount: 11.98,
      category: 'Subscription'
    }
  },
  {
    input: '08/31/2025 DD *DOORDASH MCDONALDS303 2ND STREET 8559731040 94107 CA USA 2% $1.13 $56.51',
    output: {
      date: '08/31/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 56.51,
      category: 'Dining'
    }
  },
  {
    input: '09/01/2025 PAYPAL *TUNEMYMUSIC hplX 7 4029357733 6816727 ISRISR 1% $0.06 $5.50',
    output: {
      date: '09/01/2025',
      description: 'PAYPAL *TUNEMYMUSIC',
      address: 'ISRAEL',
      amount: 5.50,
      category: 'Music'
    }
  },
  {
    input: '09/01/2025 PAYPAL *TUNEMYMUSIC hplX 7 4029357733 6816727 ISRISR 1% $0.06 $5.50',
    output: {
      date: '09/01/2025',
      description: 'PAYPAL *TUNEMYMUSIC',
      address: 'ISRAEL',
      amount: 5.50,
      category: 'Music'
    }
  },
  {
    input: '09/01/2025 PAYPAL *TUNEMYMUSIC hplX 7 4029357733 6816727 ISRISR 1% $0.06 $5.50',
    output: {
      date: '09/01/2025',
      description: 'PAYPAL *TUNEMYMUSIC',
      address: 'ISRAEL',
      amount: 5.50,
      category: 'Music'
    }
  },
  {
    input: '09/01/2025 ALDI 72069 2601 LYNDALE AVE MINNEAPOLIS 55408 MN USA 2% $1.02 $50.99',
    output: {
      date: '09/01/2025',
      description: 'ALDI',
      address: '2601 LYNDALE AVE MINNEAPOLIS MN 55408',
      amount: 50.99,
      category: 'Groceries'
    }
  },
  {
    input: '09/02/2025 DD *DOORDASH DARBARIND303 2ND STREET 8559731040 94107 CA USA 2% $0.72 $36.00',
    output: {
      date: '09/02/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 36.00,
      category: 'Dining'
    }
  },
  {
    input: '09/03/2025 TakeAction Minnesota 705 Raymond Ave #100 SAINT PAUL 55114 MN USA 1% $0.21 $20.85',
    output: {
      date: '09/03/2025',
      description: 'TakeAction Minnesota',
      address: '705 Raymond Ave #100 SAINT PAUL MN 55114',
      amount: 20.85,
      category: 'Donations'
    }
  },
  {
    input: '09/03/2025 DD *DOORDASH TENKARAME303 2ND STREET 8559731040 94107 CA USA 2% $0.44 $21.89',
    output: {
      date: '09/03/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 21.89,
      category: 'Dining'
    }
  },
  {
    input: '09/04/2025 SP INTELLIGENTSIA COFF1850 W. Fulton St. CHICAGO 60612 IL USA 1% $0.18 $17.50',
    output: {
      date: '09/04/2025',
      description: 'SP INTELLIGENTSIA COFF',
      address: '1850 W Fulton St CHICAGO IL 60612',
      amount: 17.50,
      category: 'Groceries'
    }
  },
  {
    input: '09/05/2025 U OF M PARKING 511 WASHINGTON AVE SE MINNEAPOLIS 55455 MN USA 2% $0.06 $3.00',
    output: {
      date: '09/05/2025',
      description: 'U OF M PARKING',
      address: '511 WASHINGTON AVE SE MINNEAPOLIS MN 55455',
      amount: 3.00,
      category: 'Transportation'
    }
  },
  {
    input: '09/05/2025 SPEEDWAY 46374 2200 LYNDALE AVE S MINNEAPOLIS 55405 MN USA 2% $1.03 $51.40',
    output: {
      date: '09/05/2025',
      description: 'SPEEDWAY',
      address: '2200 LYNDALE AVE S MINNEAPOLIS MN 55405',
      amount: 51.40,
      category: 'Transportation'
    }
  },
  {
    input: '09/05/2025 WHOP*ROCKET LEAGUE CLU300 Kent Avenue New York 11249 NY USA 2% $2.08 $103.95',
    output: {
      date: '09/05/2025',
      description: 'WHOP*ROCKET LEAGUE CLU',
      address: '300 Kent Avenue New York NY 11249',
      amount: 103.95,
      category: 'Entertainment'
    }
  },
  {
    input: '09/05/2025 DD *DOORDASH MYBURGER 303 2ND STREET 8559731040 94107 CA USA 2% $0.65 $32.42',
    output: {
      date: '09/05/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 32.42,
      category: 'Dining'
    }
  },
  {
    input: '09/06/2025 CAPSULE PHARMACY 122 W 146TH Street NEW YORK 10039 NY USA 1% $0.24 $23.50',
    output: {
      date: '09/06/2025',
      description: 'CAPSULE PHARMACY',
      address: '122 W 146TH Street NEW YORK NY 10039',
      amount: 23.50,
      category: 'Healthcare'
    }
  },
  {
    input: '09/06/2025 CHEWY.COM 7700 West Sunrise Boulevard 800-672-4399 33322 FL USA 2% $0.67 $33.54',
    output: {
      date: '09/06/2025',
      description: 'CHEWY.COM',
      address: '7700 West Sunrise Boulevard FL 33322',
      amount: 33.54,
      category: 'Pet Care'
    }
  },
  {
    input: '09/08/2025 NETFLIX.COM AV BERNARDINO DE CAMPOS 98 SAO PAULO 0400404000BRABRA 1% $0.08 $8.34',
    output: {
      date: '09/08/2025',
      description: 'NETFLIX.COM',
      address: 'SAO PAULO BRAZIL',
      amount: 8.34,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/08/2025 DD *DOORDASH HAWAIIPOK303 2ND STREET 8559731040 94107 CA USA 2% $0.71 $35.53',
    output: {
      date: '09/08/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 35.53,
      category: 'Dining'
    }
  },
  {
    input: '09/10/2025 U OF M-BOYNTON EYE 410 CHURCH ST SE MINNEAPOLIS 55455 MN USA 2% $1.40 $70.00',
    output: {
      date: '09/10/2025',
      description: 'U OF M-BOYNTON EYE',
      address: '410 CHURCH ST SE MINNEAPOLIS MN 55455',
      amount: 70.00,
      category: 'Healthcare'
    }
  },
  {
    input: '09/10/2025 UBER *TRIP 706 MISSION ST 8005928996 94105 CA USA 2% $0.38 $18.93',
    output: {
      date: '09/10/2025',
      description: 'UBER *TRIP',
      address: '706 MISSION ST CA 94105',
      amount: 18.93,
      category: 'Transportation'
    }
  },
  {
    input: '09/10/2025 OLO*Punch Pizza 3226 W Lake St Minneapolis 55416 MN USA 2% $0.86 $43.17',
    output: {
      date: '09/10/2025',
      description: 'OLO*Punch Pizza',
      address: '3226 W Lake St Minneapolis MN 55416',
      amount: 43.17,
      category: 'Dining'
    }
  },
  {
    input: '09/10/2025 BARNES & NOBLE #2516 3216 W LAKE ST MINNEAPOLIS 55416 MN USA 2% $1.48 $74.06',
    output: {
      date: '09/10/2025',
      description: 'BARNES & NOBLE',
      address: '3216 W LAKE ST MINNEAPOLIS MN 55416',
      amount: 74.06,
      category: 'Shopping'
    }
  },
  {
    input: '09/11/2025 10016N CLINICS & SURGE909 Fulton St SE MINNEAPOLIS 55455 MN USA 2% $0.12 $6.00',
    output: {
      date: '09/11/2025',
      description: '10016N CLINICS & SURGE',
      address: '909 Fulton St SE MINNEAPOLIS MN 55455',
      amount: 6.00,
      category: 'HealthCare'
    }
  },
  {
    input: '09/11/2025 ST ANTHONY PARK DENTAL2278 COMO AVE SAINT PAUL 55108 MN USA 1% $7.35 $734.50',
    output: {
      date: '09/11/2025',
      description: 'ST ANTHONY PARK DENTAL',
      address: '2278 COMO AVE SAINT PAUL MN 55108',
      amount: 734.50,
      category: 'Healthcare'
    }
  },
  {
    input: '09/11/2025 APPLE.COM/BILL ONE APPLE PARK CUPERTINO 95014 CA USA 3% $0.46 $15.25',
    output: {
      date: '09/11/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK CUPERTINO CA 95014',
      amount: 15.25,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/11/2025 PAYPAL *HOTMART 7700 EASTPORT PARKWAY 4029357733 10016 NY USA 1% $1.08 $107.93',
    output: {
      date: '09/11/2025',
      description: 'PAYPAL *HOTMART',
      address: '7700 EASTPORT PARKWAY NY 10016',
      amount: 107.93,
      category: 'Music'
    }
  },
  {
    input: '09/12/2025 OLO*Punch Pizza 3226 W Lake St Minneapolis 55416 MN USA 2% $0.65 $32.60',
    output: {
      date: '09/12/2025',
      description: 'OLO*Punch Pizza',
      address: '3226 W Lake St Minneapolis MN 55416',
      amount: 32.60,
      category: 'Dining'
    }
  },
  {
    input: '09/13/2025 PBNOIZE RUA CANCIO GOMES 0 PORTO ALEGRE 91330000 BRABRA 1% $0.23 $22.53',
    output: {
      date: '09/13/2025',
      description: 'PBNOIZE',
      address: 'PORTO ALEGRE BRAZIL',
      amount: 22.53,
      category: 'Music'
    }
  },
  {
    input: '09/13/2025 SQSP* WORKSP#200738047225 Varick St NEW YORK 10014 NY USA 1% $0.18 $18.32',
    output: {
      date: '09/13/2025',
      description: 'SQSP*',
      address: '225 Varick St NEW YORK NY 10014',
      amount: 18.32,
      category: 'Software'
    }
  },
  {
    input: '09/13/2025 CUB FOODS #01693 1104 LAGOON AVE MINNEAPOLIS 55408 MN USA 2% $0.93 $46.43',
    output: {
      date: '09/13/2025',
      description: 'CUB FOODS',
      address: '1104 LAGOON AVE MINNEAPOLIS MN 55408',
      amount: 46.43,
      category: 'Groceries'
    }
  },
  {
    input: '09/13/2025 JOBRIGHT.AI 3120 Scott Boulevard SANTA CLARA 95054 CA USA 1% $0.70 $69.99',
    output: {
      date: '09/13/2025',
      description: 'JOBRIGHT.AI',
      address: '3120 Scott Boulevard SANTA CLARA CA 95054',
      amount: 69.99,
      category: 'Career'
    }
  },
  {
    input: '09/13/2025 TST* 2 SCOOPS ICE CREA921 SELBY AVE SAINT PAUL 55104 MN USA 2% $0.45 $22.42',
    output: {
      date: '09/13/2025',
      description: 'TST* 2 SCOOPS ICE CREA',
      address: '921 SELBY AVE SAINT PAUL MN 55104',
      amount: 22.42,
      category: 'Dining'
    }
  },
  {
    input: '09/14/2025 CAPSULE PHARMACY 122 W 146TH Street NEW YORK 10039 NY USA 1% $0.07 $7.00',
    output: {
      date: '09/14/2025',
      description: 'CAPSULE PHARMACY',
      address: '122 W 146TH Street NEW YORK NY 10039',
      amount: 7.00,
      category: 'Healthcare'
    }
  },
  {
    input: '09/14/2025 CUB FOODS #01693 1104 LAGOON AVE MINNEAPOLIS 55408 MN USA 2% $1.24 $61.78',
    output: {
      date: '09/14/2025',
      description: 'CUB FOODS',
      address: '1104 LAGOON AVE MINNEAPOLIS MN 55408',
      amount: 61.78,
      category: 'Groceries'
    }
  },
  {
    input: '09/16/2025 TIDAL.COM BRICKELL AVENUE, 18TH FLOOR 1450 Miami 33131 FL USA 1% $0.12 $11.98',
    output: {
      date: '09/16/2025',
      description: 'TIDAL.COM',
      address: 'BRICKELL AVENUE MIAMI FL 33131',
      amount: 11.98,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/16/2025 WHOP*ROCKET LEAGUE CLU300 Kent Ave STE 401 BROOKLYN 11249 NY USA 2% $0.57 $28.35',
    output: {
      date: '09/16/2025',
      description: 'WHOP*ROCKET LEAGUE CLU',
      address: '300 Kent Ave STE 401 BROOKLYN NY 11249',
      amount: 28.35,
      category: 'Entertainment'
    }
  },
  {
    input: '09/19/2025 SP 10000 INC 4104 24th St. PMB 143 SAN FRANCISCO94114 CA USA 1% $0.65 $64.60',
    output: {
      date: '09/19/2025',
      description: 'SP 10000 INC',
      address: '4104 24th St PMB 143 SAN FRANCISCO CA 94114',
      amount: 64.60,
      category: 'Healthcare'
    }
  },
  {
    input: '09/19/2025 SQ *LAKE AND BRYANT 821 W Lake St Minneapolis 55408 MN USA 2% $0.53 $26.45',
    output: {
      date: '09/19/2025',
      description: 'SQ *LAKE AND BRYANT',
      address: '821 W Lake St Minneapolis MN 55408',
      amount: 26.45,
      category: 'Dining'
    }
  },
  {
    input: '09/19/2025 TWIN TOWN GUITARS 3400 LYNDALE AVE S MINNEAPOLIS 55408 MN USA 2% $0.26 $12.97',
    output: {
      date: '09/19/2025',
      description: 'TWIN TOWN GUITARS',
      address: '3400 LYNDALE AVE S MINNEAPOLIS MN 55408',
      amount: 12.97,
      category: 'Music'
    }
  },
  {
    input: '09/19/2025 BRYANT HARDWARE 818 W 36TH ST MINNEAPOLIS 55408-4106MN USA 2% $0.37 $18.52',
    output: {
      date: '09/19/2025',
      description: 'BRYANT HARDWARE',
      address: '818 W 36TH ST MINNEAPOLIS MN 55408',
      amount: 18.52,
      category: 'Home Improvement'
    }
  },
  {
    input: '09/20/2025 SQ *LA DONA CERVECERIA241 Fremont Ave N Minneapolis 55405 MN USA 2% $0.19 $9.60',
    output: {
      date: '09/20/2025',
      description: 'SQ *LA DONA CERVECERIA',
      address: '241 Fremont Ave N Minneapolis MN 55405',
      amount: 9.60,
      category: 'Dining'
    }
  },
  {
    input: '09/20/2025 TST*BARBETTE 1600 W Lake St Minneapolis 55408 MN USA 1% $0.97 $96.73',
    output: {
      date: '09/20/2025',
      description: 'TST*BARBETTE',
      address: '1600 W Lake St Minneapolis MN 55408',
      amount: 96.73,
      category: 'Dining'
    }
  },
  {
    input: '09/21/2025 ALDI 72069 2601 LYNDALE AVE MINNEAPOLIS 55408 MN USA 2% $2.12 $105.80',
    output: {
      date: '09/21/2025',
      description: 'ALDI',
      address: '2601 LYNDALE AVE MINNEAPOLIS MN 55408',
      amount: 105.80,
      category: 'Groceries'
    }
  },
  {
    input: '09/21/2025 SOCIAL MEDIA GROWTH 101 E MCNAB RD APT 309 9549457025 33060 FL USA 2% $1.38 $69.00',
    output: {
      date: '09/21/2025',
      description: 'SOCIAL MEDIA GROWTH',
      address: '101 E MCNAB RD APT 309 FL 33060',
      amount: 69.00,
      category: 'Music'
    }
  },
  {
    input: '09/22/2025 DD *DOORDASH MYBURGER 303 2ND STREET 8559731040 94107 CA USA 2% $0.95 $47.58',
    output: {
      date: '09/22/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 47.58,
      category: 'Dining'
    }
  },
  {
    input: '09/23/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.09 $2.99',
    output: {
      date: '09/23/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 2.99,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/23/2025 SLING.COM 9601 S MERIDIAN BLVD. ENGLEWOOD 80112 CO USA 1% $0.15 $15.25',
    output: {
      date: '09/23/2025',
      description: 'SLING.COM',
      address: '9601 S MERIDIAN BLVD ENGLEWOOD CO 80112',
      amount: 15.25,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/25/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.09 $2.99',
    output: {
      date: '09/25/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 2.99,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/26/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $1.05 $34.86',
    output: {
      date: '09/26/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 34.86,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/26/2025 DD *DOORDASH GYU-KAKUJ303 2ND STREET 8559731040 94107 CA USA 2% $0.40 $19.92',
    output: {
      date: '09/26/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 19.92,
      category: 'Dining'
    }
  },
  {
    input: '09/27/2025 DD *DOORDASH POPEYESLO303 2ND STREET 8559731040 94107 CA USA 2% $1.19 $59.61',
    output: {
      date: '09/27/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 59.61,
      category: 'Dining'
    }
  },
  {
    input: '09/27/2025 PAYPAL *RECORDSFIND 7700 EASTPORT PARKWAY 4029357733 02110 MA USA 1% $0.25 $24.95',
    output: {
      date: '09/27/2025',
      description: 'PAYPAL *RECORDSFIND',
      address: '7700 EASTPORT PARKWAY MA 02110',
      amount: 24.95,
      category: 'Music'
    }
  },
  {
    input: '09/28/2025 OPENAI *CHATGPT SUBSCR548 Market Street PMB 97273 SAN FRANCISCO94104-5401CA USA 2% $0.40 $20.00',
    output: {
      date: '09/28/2025',
      description: 'OPENAI *CHATGPT',
      address: '548 Market Street SAN FRANCISCO CA 94104',
      amount: 20.00,
      category: 'Subscriptions'
    }
  },
  {
    input: '09/29/2025 ANTHROPIC 548 Market Street PMB 90375 SAN FRANCISCO94104 CA USA 1% $0.05 $5.00',
    output: {
      date: '09/29/2025',
      description: 'ANTHROPIC',
      address: '548 Market Street SAN FRANCISCO CA 94104',
      amount: 5.00,
      category: 'Software'
    }
  },
  {
    input: '09/30/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.39 $12.99',
    output: {
      date: '09/30/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 12.99,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/01/2025 UHG OPTUM CAFE QPS11000 OPTUM CIRCLE MN101 EDEN PRAIRIE 55344 MN USA 2% $0.04 $2.01',
    output: {
      date: '07/01/2025',
      description: 'UHG OPTUM CAFE',
      address: '11000 OPTUM CIRCLE EDEN PRAIRIE MN 55344',
      amount: 2.01,
      category: 'Dining'
    }
  },
  {
    input: '07/01/2025 BP#9269507SHADY OAKQPS11190 WEST 62ND STREET EDEN PRAIRIE 55344 MN USA 1% $0.25 $25.00',
    output: {
      date: '07/01/2025',
      description: 'BP',
      address: '11190 WEST 62ND STREET EDEN PRAIRIE MN 55344',
      amount: 25.00,
      category: 'Transportation'
    }
  },
  {
    input: '07/02/2025 DD *DOORDASHMCDONALDS 303 2ND STREET 8559731040 94107 CA USA 2% $0.46 $23.09',
    output: {
      date: '07/02/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 23.09,
      category: 'Dining'
    }
  },
  {
    input: '07/03/2025 TakeAction Minnesota 705 Raymond Ave #100 SAINT PAUL 55114 MN USA 1% $0.21 $20.85',
    output: {
      date: '07/03/2025',
      description: 'TakeAction Minnesota',
      address: '705 Raymond Ave #100 SAINT PAUL MN 55114',
      amount: 20.85,
      category: 'Donations'
    }
  },
  {
    input: '07/03/2025 SMOKELESS 9201 E BLOOMINGTON FWY ST BLOOMINGTON 55420 MN USA 1% $0.87 $87.09',
    output: {
      date: '07/03/2025',
      description: 'SMOKELESS',
      address: '9201 E BLOOMINGTON FWY ST BLOOMINGTON MN 55420',
      amount: 87.09,
      category: 'Shopping'
    }
  },
  {
    input: '07/03/2025 ONSTREET 8090 33 N 9TH ST MINNEAPOLIS 55454 MN USA 2% $0.16 $7.75',
    output: {
      date: '07/03/2025',
      description: 'ONSTREET',
      address: '33 N 9TH ST MINNEAPOLIS MN 55454',
      amount: 7.75,
      category: 'Transportation'
    }
  },
  {
    input: '07/03/2025 TST* BAR LA GRASSA 800 WASHINGTON AVE N STE 102 MINNEAPOLIS 55401 MN USA 1% $1.54 $154.03',
    output: {
      date: '07/03/2025',
      description: 'TST* BAR LA GRASSA',
      address: '800 WASHINGTON AVE N STE 102 MINNEAPOLIS MN 55401',
      amount: 154.03,
      category: 'Dining'
    }
  },
  {
    input: '07/04/2025 TST* BIRDEZ2 800 W LAKE ST MINNEAPOLIS 55408 MN USA 2% $0.69 $34.68',
    output: {
      date: '07/04/2025',
      description: 'TST* BIRDEZ2',
      address: '800 W LAKE ST MINNEAPOLIS MN 55408',
      amount: 34.68,
      category: 'Dining'
    }
  },
  {
    input: '07/04/2025 ENGLISH FOR CANADA 1708 Columbia Street VANCOUVER V5Y0H7 BC CAN 1% $0.33 $33.20',
    output: {
      date: '07/04/2025',
      description: 'ENGLISH FOR CANADA',
      address: '1708 Columbia Street VANCOUVER BC CANADA',
      amount: 33.20,
      category: 'Career'
    }
  },
  {
    input: '07/05/2025 AFFIRM.COM PAYMENTS 650 California St. 12th Floor SAN FRANCISCO94108 CA USA 1% $2.08 $208.24',
    output: {
      date: '07/05/2025',
      description: 'AFFIRM.COM PAYMENTS',
      address: '650 California St 12th Floor SAN FRANCISCO CA 94108',
      amount: 208.24,
      category: 'Personal Finance'
    }
  },
  {
    input: '07/05/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.49 $16.34',
    output: {
      date: '07/05/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 16.34,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/05/2025 DD *DOORDASHMCDONALDS 303 2ND STREET 8559731040 94107 CA USA 2% $0.59 $29.43',
    output: {
      date: '07/05/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 29.43,
      category: 'Dining'
    }
  },
  {
    input: '07/06/2025 SP BETTER VOICE 10183 N. Evergreen Circle CEDAR HILLS 84062 UT USA 1% $0.51 $50.94',
    output: {
      date: '07/06/2025',
      description: 'SP BETTER VOICE',
      address: '10183 N Evergreen Circle CEDAR HILLS UT 84062',
      amount: 50.94,
      category: 'Professional Services'
    }
  },
  {
    input: '07/08/2025 NETFLIX ENTRETENIMENTOAlameda Xingu, 350 Barueri 06455911 SP BRA 1% $0.08 $8.28',
    output: {
      date: '07/08/2025',
      description: 'NETFLIX',
      address: 'BARUERI BRAZIL',
      amount: 8.28,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/08/2025 UHG OPTUM CAFE QPS11000 OPTUM CIRCLE MN101 EDEN PRAIRIE 55344 MN USA 2% $0.08 $4.23',
    output: {
      date: '07/08/2025',
      description: 'UHG OPTUM CAFE',
      address: '11000 OPTUM CIRCLE EDEN PRAIRIE MN 55344',
      amount: 4.23,
      category: 'Dining'
    }
  },
  {
    input: '07/08/2025 PROGRESSIVE INSU CE 6300 WILSON MILLS RD 8557580630 44143 OH USA 2% $2.39 $119.68',
    output: {
      date: '07/08/2025',
      description: 'PROGRESSIVE INSU CE',
      address: '6300 WILSON MILLS RD OH 44143',
      amount: 119.68,
      category: 'Utilities'
    }
  },
  {
    input: '07/08/2025 UHG OPTUM CAFE QPS11000 OPTUM CIRCLE MN101 EDEN PRAIRIE 55344 MN USA 2% $0.08 $4.02',
    output: {
      date: '07/08/2025',
      description: 'UHG OPTUM CAFE',
      address: '11000 OPTUM CIRCLE EDEN PRAIRIE MN 55344',
      amount: 4.02,
      category: 'Dining'
    }
  },
  {
    input: '07/08/2025 SQSP* INV189326996 225 Varick St NEW YORK 10014 NY USA 1% $0.15 $15.00',
    output: {
      date: '07/08/2025',
      description: 'SQSP*',
      address: '225 Varick St NEW YORK NY 10014',
      amount: 15.00,
      category: 'Software'
    }
  },
  {
    input: '07/10/2025 BANDZOOGLE WEBSITE 1608 S. Ashland Ave, #92842 CHICAGO 60608-2013IL USA 1% $2.00 $199.50',
    output: {
      date: '07/10/2025',
      description: 'BANDZOOGLE WEBSITE',
      address: '1608 S Ashland Ave CHICAGO IL 60608',
      amount: 199.50,
      category: 'Music'
    }
  },
  {
    input: '07/12/2025 TST* LYNLAKE BREWERY 2934 LYNDALE AVE S MINNEAPOLIS 55408 MN USA 1% $1.09 $108.74',
    output: {
      date: '07/12/2025',
      description: 'TST* LYNLAKE BREWERY',
      address: '2934 LYNDALE AVE S MINNEAPOLIS MN 55408',
      amount: 108.74,
      category: 'Dining'
    }
  },
  {
    input: '07/13/2025 PBNOIZE RUA CANCIO GOMES PORTO ALEGRE 91330000 BRABRA 1% $0.22 $21.81',
    output: {
      date: '07/13/2025',
      description: 'PBNOIZE',
      address: 'PORTO ALEGRE BRAZIL',
      amount: 21.81,
      category: 'Music'
    }
  },
  {
    input: '07/13/2025 SQSP* INV189883051 225 Varick St NEW YORK 10014 NY USA 1% $0.18 $18.32',
    output: {
      date: '07/13/2025',
      description: 'SQSP*',
      address: '225 Varick St NEW YORK NY 10014',
      amount: 18.32,
      category: 'Software'
    }
  },
  {
    input: '07/13/2025 CVS/PHARMACY #08285 1010 LAKE STREET MINNEAPOLIS 55419 MN USA 2% $0.14 $6.89',
    output: {
      date: '07/13/2025',
      description: 'CVS/PHARMACY',
      address: '1010 LAKE STREET MINNEAPOLIS MN 55419',
      amount: 6.89,
      category: 'Healthcare'
    }
  },
  {
    input: '07/15/2025 CAPSULE PHARMACY 122 W 146TH Street NEW YORK 10039 NY USA 1% $0.07 $7.00',
    output: {
      date: '07/15/2025',
      description: 'CAPSULE PHARMACY',
      address: '122 W 146TH Street NEW YORK NY 10039',
      amount: 7.00,
      category: 'Healthcare'
    }
  },
  {
    input: '07/17/2025 UHG OPTUM CAFE QPS11000 OPTUM CIRCLE MN101 EDEN PRAIRIE 55344 MN USA 2% $0.28 $13.86',
    output: {
      date: '07/17/2025',
      description: 'UHG OPTUM CAFE',
      address: '11000 OPTUM CIRCLE EDEN PRAIRIE MN 55344',
      amount: 13.86,
      category: 'Dining'
    }
  },
  {
    input: '07/17/2025 SQ *LAKE AND BRYANT 821 W Lake St Minneapolis 55408 MN USA 2% $0.11 $5.72',
    output: {
      date: '07/17/2025',
      description: 'SQ *LAKE AND BRYANT',
      address: '821 W Lake St Minneapolis MN 55408',
      amount: 5.72,
      category: 'Dining'
    }
  },
  {
    input: '07/17/2025 SQ *LAKE AND BRYANT 821 W Lake St Minneapolis 55408 MN USA 2% $0.17 $8.58',
    output: {
      date: '07/17/2025',
      description: 'SQ *LAKE AND BRYANT',
      address: '821 W Lake St Minneapolis MN 55408',
      amount: 8.58,
      category: 'Dining'
    }
  },
  {
    input: '07/18/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $1.05 $34.86',
    output: {
      date: '07/18/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 34.86,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/18/2025 TIDAL.COM BRICKELL AVENUE, 18TH FLOOR 1450 Miami 33131 FL USA 1% $0.12 $11.98',
    output: {
      date: '07/18/2025',
      description: 'TIDAL.COM',
      address: 'BRICKELL AVENUE MIAMI FL 33131',
      amount: 11.98,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/19/2025 VOCALIMAGE.APP Kadaka tee 137-42 Harju maakond, Kesklinna l TALLINN 12915 DUBEST 2% $0.10 $4.99',
    output: {
      date: '07/19/2025',
      description: 'VOCALIMAGE.APP',
      address: 'TALLINN ESTONIA',
      amount: 4.99,
      category: 'Software'
    }
  },
  {
    input: '07/20/2025 PIZZA LUCE 3200 Lyndale Ave S MINNEAPOLIS 55408 MN USA 1% $0.47 $46.95',
    output: {
      date: '07/20/2025',
      description: 'PIZZA LUCE',
      address: '3200 Lyndale Ave S MINNEAPOLIS MN 55408',
      amount: 46.95,
      category: 'Dining'
    }
  },
  {
    input: '07/21/2025 AFFIRM.COM PAYMENTS 650 California St. 12th Floor SAN FRANCISCO94108 CA USA 1% $2.08 $208.24',
    output: {
      date: '07/21/2025',
      description: 'AFFIRM.COM PAYMENTS',
      address: '650 California St 12th Floor SAN FRANCISCO CA 94108',
      amount: 208.24,
      category: 'Personal Finance'
    }
  },
  {
    input: '07/21/2025 OPEN STUDIO 3333 Washington Ave, Ste 140 SAINT LOUIS 63103 MO USA 2% $7.80 $390.00',
    output: {
      date: '07/21/2025',
      description: 'OPEN STUDIO',
      address: '3333 Washington Ave Ste 140 SAINT LOUIS MO 63103',
      amount: 390.00,
      category: 'Music'
    }
  },
  {
    input: '07/21/2025 OPEN STUDIO 3333 Washington Ave, Ste 140 SAINT LOUIS 63103 MO USA 2% $7.80 $390.00',
    output: {
      date: '07/21/2025',
      description: 'OPEN STUDIO',
      address: '3333 Washington Ave Ste 140 SAINT LOUIS MO 63103',
      amount: 390.00,
      category: 'Music'
    }
  },
  {
    input: '07/21/2025 OPEN STUDIO 3333 Washington Ave, Ste 140 SAINT LOUIS 63103 MO USA 2% $7.80 $390.00',
    output: {
      date: '07/21/2025',
      description: 'OPEN STUDIO',
      address: '3333 Washington Ave Ste 140 SAINT LOUIS MO 63103',
      amount: 390.00,
      category: 'Music'
    }
  },
  {
    input: '07/21/2025 SOCIAL MEDIA GROWTH 101 E MCNAB RD APT 309 9549457025 33060 FL USA 2% $1.38 $69.00',
    output: {
      date: '07/21/2025',
      description: 'SOCIAL MEDIA GROWTH',
      address: '101 E MCNAB RD APT 309 FL 33060',
      amount: 69.00,
      category: 'Music'
    }
  },
  {
    input: '07/21/2025 SOCIAL MEDIA GROWTH 101 E MCNAB RD APT 309 9549457025 33060 FL USA 2% $1.38 $69.00',
    output: {
      date: '07/21/2025',
      description: 'SOCIAL MEDIA GROWTH',
      address: '101 E MCNAB RD APT 309 FL 33060',
      amount: 69.00,
      category: 'Music'
    }
  },
  {
    input: '07/22/2025 UHG OPTUM CAFE QPS11000 OPTUM CIRCLE MN101 EDEN PRAIRIE 55344 MN USA 2% $0.20 $10.09',
    output: {
      date: '07/22/2025',
      description: 'UHG OPTUM CAFE',
      address: '11000 OPTUM CIRCLE EDEN PRAIRIE MN 55344',
      amount: 10.09,
      category: 'Dining'
    }
  },
  {
    input: '07/23/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.09 $2.99',
    output: {
      date: '07/23/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 2.99,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/23/2025 SLING.COM 9601 S MERIDIAN BLVD. ENGLEWOOD 80112 CO USA 1% $0.15 $15.25',
    output: {
      date: '07/23/2025',
      description: 'SLING.COM',
      address: '9601 S MERIDIAN BLVD ENGLEWOOD CO 80112',
      amount: 15.25,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/23/2025 DD *DOORDASHGYU-KAKUJA303 2ND STREET 8559731040 94107 CA USA 2% $0.58 $29.09',
    output: {
      date: '07/23/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 29.09,
      category: 'Dining'
    }
  },
  {
    input: '07/24/2025 PP*METAPLATFOR 7700 EASTPORT PARKWAY 4029357733 94304 CA USA 1% $0.14 $14.12',
    output: {
      date: '07/24/2025',
      description: 'PP*METAPLATFOR',
      address: '7700 EASTPORT PARKWAY CA 94304',
      amount: 14.12,
      category: 'Music'
    }
  },
  {
    input: '07/24/2025 PP*METAPLATFOR 7700 EASTPORT PARKWAY 4029357733 94304 CA USA 1% $0.14 $14.12',
    output: {
      date: '07/24/2025',
      description: 'PP*METAPLATFOR',
      address: '7700 EASTPORT PARKWAY CA 94304',
      amount: 14.12,
      category: 'Music'
    }
  },
  {
    input: '07/24/2025 PP*METAPLATFOR 7700 EASTPORT PARKWAY 4029357733 94304 CA USA 1% $0.14 $14.12',
    output: {
      date: '07/24/2025',
      description: 'PP*METAPLATFOR',
      address: '7700 EASTPORT PARKWAY CA 94304',
      amount: 14.12,
      category: 'Music'
    }
  },
  {
    input: '07/25/2025 APPLE.COM/BILL ONE APPLE PARK WAY 866-712-7753 95014 CA USA 3% $0.09 $2.99',
    output: {
      date: '07/25/2025',
      description: 'APPLE.COM/BILL',
      address: 'ONE APPLE PARK WAY CA 95014',
      amount: 2.99,
      category: 'Subscriptions'
    }
  },
  {
    input: '07/26/2025 VOCALIMAGE.APP Kadaka tee 137-42 Harju maakond, Kesklinna l TALLINN 12915 DUBEST 2% $0.20 $9.99',
    output: {
      date: '07/26/2025',
      description: 'VOCALIMAGE.APP',
      address: 'TALLINN ESTONIA',
      amount: 9.99,
      category: 'Software'
    }
  },
  {
    input: '07/26/2025 DD *DOORDASHFIVEGUYSBU303 2ND STREET 8559731040 94107 CA USA 2% $0.85 $42.34',
    output: {
      date: '07/26/2025',
      description: 'DD *DOORDASH',
      address: '303 2ND STREET CA 94107',
      amount: 42.34,
      category: 'Dining'
    }
  },
  {
    input: '07/27/2025 ONSTREET 8090 33 N 9TH ST MINNEAPOLIS 55454 MN USA 2% $0.11 $5.25',
    output: {
      date: '07/27/2025',
      description: 'ONSTREET',
      address: '33 N 9TH ST MINNEAPOLIS MN 55454',
      amount: 5.25,
      category: 'Transportation'
    }
  },
  {
    input: '07/27/2025 TST*THE FREEHOUSE 701 N Washington Ave 101 Minneapolis 55401 MN USA 2% $1.79 $89.58',
    output: {
      date: '07/27/2025',
      description: 'TST*THE FREEHOUSE',
      address: '701 N Washington Ave MINNEAPOLIS MN 55401',
      amount: 89.58,
      category: 'Dining'
    }
  }
]
