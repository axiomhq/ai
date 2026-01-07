import { type ReviewCollection } from '../schemas';

export const reviews: ReviewCollection = [
  {
    input: {
      review:
        'Absolutely brilliant kettle. Boils water super quick and looks gorgeous on the worktop. Had it for three months now and no issues whatsoever. The temperature control is a game changer for my green tea.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Excellent kettle with fast boiling, attractive design, and useful temperature control for tea preparation.',
    },
    metadata: {
      id: 'B09X7KL2M4',
      profile: 'A2HJKF8DN3PLQ9R7TM6ZW1XE4YBS',
      title: 'Electric Kettle with Variable Temperature Control, 1.7L Stainless Steel',
    },
  },
  {
    input: {
      review:
        'dont waste ur money total garbage the handle broke after 2 weeks and customer service was useless',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'negative',
      summary:
        'Poor quality product with handle breaking after two weeks and unhelpful customer service.',
    },
    metadata: {
      id: 'B0B3M8TQ5W',
      profile: 'A9KL2P4NT6H8RXQZ7YC3FW1JV5MG',
      title: 'Non-Stick Frying Pan Set, 3-Piece Aluminum Cookware',
    },
  },
  {
    input: {
      review:
        'It works fine I guess. Nothing special really. Does what it says on the tin. Probably would look elsewhere next time but its not terrible.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'neutral',
      summary: 'Functional product that meets basic expectations but lacks standout features.',
    },
    metadata: {
      id: 'B0C7R4HN9K',
      profile: 'A5XT9V2KJ4MW8PLQN7FC6YH3R1BZ',
      title: 'USB-C Cable 6ft, Fast Charging Braided Cord',
    },
  },
  {
    input: {
      review:
        'Received this as part of review program. The packaging seemed okay and the product looks decent but havent actually used it yet for anything serious so cant really comment on performance or durability at this stage.',
      purchase_context: 'gifted_product',
    },
    expected: {
      sentiment: 'unknown',
      summary:
        'Product appears well-packaged and visually acceptable but has not been tested for performance yet.',
    },
    metadata: {
      id: 'B0D8W5TJ2N',
      profile: 'A3CQ8F7NK9PL5HXWY2JM4RT6GVZB',
      title: 'Wireless Bluetooth Earbuds with Charging Case, 24-Hour Playtime',
    },
  },
  {
    input: {
      review:
        'We purchased these for our office and they have been fantastic. Very durable, easy to clean, and the staff love them. Great value for bulk ordering. Would definitely recommend for commercial use.',
      purchase_context: 'business',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Durable and easy to maintain product ideal for office use with excellent value for bulk orders.',
    },
    metadata: {
      id: 'B0A6V9RQ3F',
      profile: 'A8WN2QZ5K7MC4TB6HP9FX3JL1YRV',
      title: 'Stackable Office Chairs, Set of 4, Ergonomic Design with Padded Seat',
    },
  },
  {
    input: {
      review:
        'This is the worst purchase Ive made all year. The motor started making horrible grinding noises on day one and it smells like burning plastic when you turn it on. Returned immediately.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'negative',
      summary: 'Defective product with motor issues and burning plastic smell from first use.',
    },
    metadata: {
      id: 'B0E2N7KV8M',
      profile: 'A7PQ3XJ9W5MK2NC8TH4FB6YR1ZLG',
      title: 'Food Processor 12-Cup, 700W Motor with Multiple Blade Attachments',
    },
  },
  {
    input: {
      review:
        'Nice phone case sturdy feels premium but the buttons r bit stiff makes it hard to press volume controls otherwise good',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Well-made and premium-feeling case with slightly stiff buttons affecting volume control access.',
    },
    metadata: {
      id: 'B0F9J3LT6R',
      profile: 'A4FR8H6NL9QT2VCK7XW5ZY3PM1BJ',
      title: 'Silicone Phone Case for iPhone 14 Pro, Shockproof Protective Cover',
    },
  },
  {
    input: {
      review:
        'Got this free to review. Its a vacuum cleaner so yeah. Havent really tested it properly but it turned on and moved around a bit. Seems alright I suppose.',
      purchase_context: 'gifted_product',
    },
    expected: {
      sentiment: 'unknown',
      summary:
        'Product powers on and operates but lacks sufficient testing to assess overall performance.',
    },
    metadata: {
      id: 'B0G4M8QW7P',
      profile: 'A6MQ9TB4H7NX5PC8JL2YW3FK1RVZ',
      title: 'Robot Vacuum Cleaner with Smart Navigation and App Control',
    },
  },
  {
    input: {
      review:
        'Absolutely love this thing Changed my morning routine completely Coffee tastes incredible and its so much easier than my old machine Highly highly recommend',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Transformative coffee maker that significantly improves morning routine with excellent taste and ease of use.',
    },
    metadata: {
      id: 'B0H7Q2NW5K',
      profile: 'A2YF9W4JX7KC5PL8NT6HB3VM1QRZ',
      title: 'Espresso Machine with Milk Frother, 15-Bar Pressure Pump',
    },
  },
  {
    input: {
      review:
        'Quality seems acceptable for the price point. Installation was straightforward. No major complaints but nothing particularly impressive either. Does its job adequately.',
      purchase_context: 'business',
    },
    expected: {
      sentiment: 'neutral',
      summary:
        'Adequate product with reasonable quality for cost and easy installation but no exceptional features.',
    },
    metadata: {
      id: 'B0J1T8PL6M',
      profile: 'A5NJ7WR2Q9VK8FC3LH4YP6TX1BZM',
      title: 'LED Desk Lamp with USB Charging Port, Adjustable Brightness',
    },
  },
  {
    input: {
      review:
        'DO NOT BUY these leak everywhere made a massive mess all over my carpet and the company refused to refund me even with photos shocking service absolutely livid',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'negative',
      summary:
        'Severely defective product that leaks causing damage with company refusing refund despite evidence.',
    },
    metadata: {
      id: 'B0K5V9TJ3N',
      profile: 'A8QW3FM7P5NJ2KX6TB4CH9YL1RVZ',
      title: 'Reusable Water Bottles, BPA-Free Plastic, Pack of 6',
    },
  },
  {
    input: {
      review:
        'My daughter loves this toy. She plays with it every single day since we got it for her birthday. Very well made and the colours are vibrant. Worth every penny.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'High-quality toy with vibrant colors that provides consistent enjoyment and excellent value.',
    },
    metadata: {
      id: 'B0L2W7QH4R',
      profile: 'A9XK4PL6H2NT8WC7FY5JM3VQ1RBZ',
      title: 'Wooden Building Blocks Set, 100 Pieces with Storage Bag',
    },
  },
  {
    input: {
      review:
        'its ok i guess the size is smaller than expected from the pictures and description but it arrived quickly and works fine so thats something',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'neutral',
      summary: 'Functional product that arrived quickly but smaller than advertised.',
    },
    metadata: {
      id: 'B0M9K3TL7W',
      profile: 'A3LH8YF9N6VP2JQ4TX7KC5WM1RBZ',
      title: 'Portable Bluetooth Speaker, Waterproof with 12-Hour Battery',
    },
  },
  {
    input: {
      review:
        'We bought these for our restaurant kitchen. They have held up remarkably well under heavy daily use. Easy to maintain and clean which is crucial for us. Will be ordering more.',
      purchase_context: 'business',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Durable kitchen equipment performing excellently under intensive commercial use with easy maintenance.',
    },
    metadata: {
      id: 'B0N6L2VM8Q',
      profile: 'A7TW2NJ9Q4KF6PL8VH5XC3YM1RBZ',
      title: 'Commercial Kitchen Cutting Boards, Set of 3, Dishwasher Safe',
    },
  },
  {
    input: {
      review:
        'Free product for review. Havent used this enough to form proper opinion. Design looks nice materials feel cheap though might update later if remember',
      purchase_context: 'gifted_product',
    },
    expected: {
      sentiment: 'unknown',
      summary:
        'Attractive design with questionable material quality but insufficient use to provide complete assessment.',
    },
    metadata: {
      id: 'B0P4H8QL9T',
      profile: 'A5JC9WN7X4PM2FL6QK8VT3HY1RBZ',
      title: 'Fitness Tracker Watch with Heart Rate Monitor and Sleep Tracking',
    },
  },
  {
    input: {
      review:
        'Cannot fault this at all. Exactly what I needed. Fits perfectly works brilliantly and the customer service when I had a question was top notch. Five stars all the way.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Perfect product that meets all needs with excellent fit, performance, and outstanding customer service.',
    },
    metadata: {
      id: 'B0Q7M2TW5N',
      profile: 'A2KB9QX6P7VN4JH8FC3TL5WY1RMZ',
      title: 'Car Phone Mount, Dashboard Windshield Holder with Strong Suction',
    },
  },
  {
    input: {
      review:
        'Terrible quality the fabric started pilling after just one wash and the colour faded dramatically not what I expected from this brand very disappointed wont buy again',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'negative',
      summary:
        'Poor fabric quality with immediate pilling and significant color fading after single wash.',
    },
    metadata: {
      id: 'B0R1N5VK8J',
      profile: 'A4TX8JL9N2WQ6PC7VH5FK3YM1RBZ',
      title: 'Cotton Bed Sheet Set, King Size, Deep Pocket Fitted Sheet',
    },
  },
  {
    input: {
      review:
        'Works as described no more no less arrived on time packaging was fine not sure what else to say about it really its just a cable',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'neutral',
      summary: 'Basic functional cable that meets standard expectations with timely delivery.',
    },
    metadata: {
      id: 'B0S8P3QJ6L',
      profile: 'A9WY2TL7K4NQ5HJ6PC8FM3VX1RBZ',
      title: 'HDMI Cable 10ft, High Speed 4K Compatible with Gold-Plated Connectors',
    },
  },
  {
    input: {
      review:
        'This is hands down the best purchase I have made this year. The quality is outstanding it exceeded all my expectations and my whole family uses it daily. Could not be happier honestly.',
      purchase_context: 'verified_purchase',
    },
    expected: {
      sentiment: 'positive',
      summary:
        'Exceptional quality product surpassing expectations and providing daily value for entire family.',
    },
    metadata: {
      id: 'B0T5K9WL2M',
      profile: 'A6PL4HY8N7QJ2VW9TC5FX3KM1RBZ',
      title: 'Air Fryer Oven, 12-in-1 Multi-Functional Countertop Convection Oven',
    },
  },
  {
    input: {
      review:
        'Received as part of vine program. Not entirely sure what to make of this product yet. Instructions were confusing setup took forever. Maybe ill update once I actually figure out how to use it properly.',
      purchase_context: 'gifted_product',
    },
    expected: {
      sentiment: 'unknown',
      summary:
        'Unclear product assessment due to confusing instructions and difficult setup requiring further use.',
    },
    metadata: {
      id: 'B0U2J7PW4N',
      profile: 'A8VN3QK6W9LJ2TX7FH4PC5YM1RBZ',
      title: 'Smart Home Security Camera System, 4-Pack with Night Vision',
    },
  },
];
