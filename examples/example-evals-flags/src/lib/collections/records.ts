import type { ListingCollection } from '../schemas';

export const listingRecords: ListingCollection = [
  {
    input: {
      seller_brief: 'Used flip flops. Blue color. Size 9. Decent condition.',
    },
    expected: {
      product_description:
        'Comfortable blue flip flops in size 9, perfect for casual summer wear. These pre-loved sandals are in decent condition and ready for beach days or poolside relaxation.',
    },
    metadata: {
      category: 'fashion',
      seller_username: '@coastalliving#54186',
    },
  },
  {
    input: {
      seller_brief: 'A high-quality mug for everyday use.',
    },
    expected: {
      product_description:
        'Durable, high-quality mug designed for daily use. Whether you are enjoying your morning coffee or afternoon tea, this reliable mug is built to last.',
    },
    metadata: {
      category: 'home',
      seller_username: '@kitchenware_pro#82041',
    },
  },
  {
    input: {
      seller_brief:
        'Vintage leather jacket from the 80s. Some wear but still stylish. Size medium.',
    },
    expected: {
      product_description:
        'Authentic 80s vintage leather jacket in size medium. This classic piece shows character with some wear, adding to its retro charm. A timeless addition to any wardrobe.',
    },
    metadata: {
      category: 'fashion',
      seller_username: '@vintage_finds#29384',
    },
  },
  {
    input: {
      seller_brief: 'used iphone 12, works fine, some scratches on back',
    },
    expected: {
      product_description:
        'Fully functional iPhone 12 in good working condition. Features minor cosmetic scratches on the back, but performs perfectly. A great value for a reliable smartphone.',
    },
    metadata: {
      category: 'electronics',
      seller_username: '@tech_seller#67293',
    },
  },
  {
    input: {
      seller_brief: 'Harry Potter complete book set. All 7 books. Good condition.',
    },
    expected: {
      product_description:
        'Complete Harry Potter series featuring all 7 books in good condition. Perfect for fans or first-time readers looking to experience the entire magical journey.',
    },
    metadata: {
      category: 'books',
      seller_username: '@bookworm_alice#91247',
    },
  },
  {
    input: {
      seller_brief: 'Yoga mat, purple, barely used, comes with carrying strap',
    },
    expected: {
      product_description:
        'Purple yoga mat in excellent condition with minimal use. Includes a convenient carrying strap for easy transport to classes or outdoor sessions.',
    },
    metadata: {
      category: 'sports',
      seller_username: '@fitness_enthusiast#45829',
    },
  },
  {
    input: {
      seller_brief: 'Lego Star Wars set. Missing a few pieces but mostly complete.',
    },
    expected: {
      product_description:
        'Lego Star Wars building set, mostly complete with only a few minor pieces missing. Great for collectors or young builders looking for an affordable entry into the Star Wars universe.',
    },
    metadata: {
      category: 'toys',
      seller_username: '@toy_collector#38475',
    },
  },
  {
    input: {
      seller_brief: 'Wooden coffee table, scratches on surface, sturdy',
    },
    expected: {
      product_description:
        'Solid wooden coffee table with a sturdy build. Features surface scratches that add rustic character. A dependable piece for any living room.',
    },
    metadata: {
      category: 'home',
      seller_username: '@furniture_deals#72156',
    },
  },
  {
    input: {
      seller_brief: 'Car phone mount. Universal fit. Works great.',
    },
    expected: {
      product_description:
        'Universal car phone mount in excellent working condition. Compatible with most smartphone models, providing secure and convenient hands-free access while driving.',
    },
    metadata: {
      category: 'automotive',
      seller_username: '@car_accessories#53921',
    },
  },
  {
    input: {
      seller_brief: 'Gaming headset with mic, black, some wear on ear pads',
    },
    expected: {
      product_description:
        'Black gaming headset with built-in microphone. Ear pads show some wear from use, but audio quality remains excellent. Perfect for gaming sessions or video calls.',
    },
    metadata: {
      category: 'electronics',
      seller_username: '@gamer_hub#64738',
    },
  },
  {
    input: {
      seller_brief: 'Samsung Galaxy Tab, 64GB, minor screen scratches, charger included',
    },
    expected: {
      product_description:
        'Samsung Galaxy Tab with 64GB storage capacity. Features minor screen scratches but functions flawlessly. Includes original charger for immediate use.',
    },
    metadata: {
      category: 'electronics',
      seller_username: '@TechRefurb',
    },
  },
  {
    input: {
      seller_brief: 'Stainless steel water bottle, 32oz, insulated, keeps drinks cold for 24 hours',
    },
    expected: {
      product_description:
        'Premium 32oz insulated stainless steel water bottle with 24-hour cold retention technology. Perfect for staying hydrated throughout your day, whether at work, gym, or outdoor adventures.',
    },
    metadata: {
      category: 'sports',
      seller_username: '@HydroGear',
    },
  },
  {
    input: {
      seller_brief: 'Nike running shoes, size 10, gently used, good tread',
    },
    expected: {
      product_description:
        'Nike running shoes in size 10 with excellent tread remaining. Gently used with plenty of life left. Ideal for runners seeking quality footwear at a great price.',
    },
    metadata: {
      category: 'fashion',
      seller_username: '@sneaker_resale#19283',
    },
  },
  {
    input: {
      seller_brief: 'Electric kettle, 1.7L, fast boil, stainless steel finish',
    },
    expected: {
      product_description:
        '1.7L electric kettle with rapid boil technology and sleek stainless steel finish. Efficient and stylish addition to any kitchen for quick hot beverages.',
    },
    metadata: {
      category: 'home',
      seller_username: '@HomeEssentials',
    },
  },
  {
    input: {
      seller_brief: 'Board game collection: Monopoly, Scrabble, and Risk. All complete.',
    },
    expected: {
      product_description:
        'Classic board game bundle featuring Monopoly, Scrabble, and Risk. All games are complete with original pieces and instructions. Perfect for family game nights.',
    },
    metadata: {
      category: 'toys',
      seller_username: '@game_night_guru#84562',
    },
  },
  {
    input: {
      seller_brief: 'Wireless mouse, ergonomic design, USB receiver included',
    },
    expected: {
      product_description:
        'Ergonomic wireless mouse designed for comfortable extended use. Includes USB receiver for easy plug-and-play connectivity. Compatible with Windows and Mac systems.',
    },
    metadata: {
      category: 'electronics',
      seller_username: '@OfficeProSupply',
    },
  },
  {
    input: {
      seller_brief: 'Cookbook collection, 5 books, various cuisines, some recipe notes in margins',
    },
    expected: {
      product_description:
        'Diverse cookbook collection featuring 5 books covering various international cuisines. Includes helpful recipe notes in margins from previous owner. Great for expanding your culinary repertoire.',
    },
    metadata: {
      category: 'books',
      seller_username: '@chef_at_home#37194',
    },
  },
  {
    input: {
      seller_brief: 'Car floor mats, all-weather rubber, fits most sedans',
    },
    expected: {
      product_description:
        'Durable all-weather rubber floor mats designed to fit most sedan models. Provides excellent protection against dirt, mud, and spills year-round.',
    },
    metadata: {
      category: 'automotive',
      seller_username: '@AutoAccessories',
    },
  },
  {
    input: {
      seller_brief: 'Desk lamp with adjustable arm, LED bulb, works perfectly',
    },
    expected: {
      product_description:
        'Functional desk lamp featuring an adjustable arm for optimal positioning. Equipped with energy-efficient LED bulb. Perfect for home office or study space.',
    },
    metadata: {
      category: 'home',
      seller_username: '@office_surplus#62847',
    },
  },
  {
    input: {
      seller_brief: 'Tennis racket, Wilson brand, intermediate level, new strings',
    },
    expected: {
      product_description:
        'Wilson tennis racket suited for intermediate players. Recently restrung and ready for the court. Excellent condition with minimal wear.',
    },
    metadata: {
      category: 'sports',
      seller_username: '@tennis_player#23956',
    },
  },
];
