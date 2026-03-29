export const RESTAURANTS = [
  { id:1, name:"Nobu Malibu",     cuisine:"Japanese Fusion", price:"$$$$", rating:4.9, stars:2, times:["7:00","8:30","9:00"], color1:"#0d1a0d", color2:"#1a2e1a", emoji:"🎋", tag:"Oceanfront",  description:"Where Japanese precision meets California coastline. The omakase here is transcendent — each course a conversation between sea and tradition." },
  { id:2, name:"Carbone",          cuisine:"Italian-American",price:"$$$",  rating:4.8, stars:1, times:["7:30","8:00","9:30"], color1:"#1a0a0a", color2:"#2e1515", emoji:"🍝", tag:"Iconic",       description:"A love letter to mid-century Italian-American cooking. Red sauce elevated to art form. The rigatoni vodka alone is worth the reservation." },
  { id:3, name:"Le Bernardin",     cuisine:"French Seafood",  price:"$$$$", rating:5.0, stars:3, times:["6:30","9:30"],         color1:"#0a0a1a", color2:"#15152e", emoji:"🦞", tag:"Legendary",    description:"Three Michelin stars. Thirty years of perfection. Eric Ripert's mastery of the sea is unmatched. This is the restaurant by which all others are measured." },
  { id:4, name:"Osteria Mozza",    cuisine:"Italian",         price:"$$$",  rating:4.7, stars:1, times:["7:00","8:30","10:00"],color1:"#1a1200", color2:"#2e2000", emoji:"🫙", tag:"Rustic Chic",  description:"Nancy Silverton's crown jewel. The mozzarella bar alone could sustain a lifetime. Rustic Italian cooking at its most honestly delicious." },
  { id:5, name:"Atomix",           cuisine:"Korean Tasting",  price:"$$$$", rating:4.9, stars:2, times:["6:00","8:00"],         color1:"#100a1a", color2:"#1e1530", emoji:"🌸", tag:"Omakase",      description:"The most ambitious Korean restaurant in America. Each course arrives like a poem — minimal, precise, devastating in its beauty." },
  { id:6, name:"Don Angie",        cuisine:"Italian-American",price:"$$$",  rating:4.8, stars:1, times:["6:30","8:00","9:30"], color1:"#1a0d08", color2:"#2e1a10", emoji:"🥂", tag:"Intimate",     description:"The kind of restaurant that feels like it was created just for you. Husband-and-wife team bringing Italian-American classics into the 21st century." },
];

export const MENU_ITEMS = {
  Starters: [
    { name:"Black Cod Miso",     desc:"Signature miso-marinated black cod, broiled",         price:"$38", available:true  },
    { name:"Toro Tartare",       desc:"Bluefin belly, Ossetra caviar, crispy rice",           price:"$52", available:true  },
    { name:"Rock Shrimp Tempura",desc:"Creamy spicy sauce, ponzu",                            price:"$32", available:false },
    { name:"New Style Sashimi",  desc:"Serrano chilli, yuzu soy, sesame oil",                 price:"$44", available:true  },
  ],
  Mains: [
    { name:"Wagyu Skewers",      desc:"A5 Japanese Wagyu, teriyaki glaze, kinome",            price:"$85", available:true  },
    { name:"Lobster Truffle",    desc:"Maine lobster, black truffle butter, micro greens",    price:"$78", available:true  },
    { name:"Yellowtail Jalapeño",desc:"Ponzu, micro cilantro, crispy garlic",                 price:"$46", available:true  },
  ],
  Desserts: [
    { name:"Yuzu Cheesecake",    desc:"Japanese yuzu curd, miso caramel, sesame tuile",      price:"$18", available:true  },
    { name:"Mochi Ice Cream Trio",desc:"Matcha, black sesame, yuzu flavours",                price:"$16", available:true  },
  ],
};

export const MOCK_BOOKINGS = [
  { id:"RB-001", time:"6:30 PM", date:"Today",    guest:"Arjun M.",  email:"arjun@email.com",  size:2, occasion:"💍 Anniversary", requests:"Window seat",   pkg:"Romance",  status:"confirmed" },
  { id:"RB-002", time:"7:00 PM", date:"Today",    guest:"Priya S.",  email:"priya@email.com",  size:4, occasion:"🎂 Birthday",    requests:"Cake surprise", pkg:"Birthday", status:"pending"   },
  { id:"RB-003", time:"7:30 PM", date:"Today",    guest:"James T.",  email:"james@email.com",  size:2, occasion:"—",              requests:"None",          pkg:"—",        status:"confirmed" },
  { id:"RB-004", time:"8:00 PM", date:"Today",    guest:"Sofia R.",  email:"sofia@email.com",  size:6, occasion:"💼 Corporate",   requests:"Separate bills",pkg:"Group",    status:"pending"   },
  { id:"RB-005", time:"8:30 PM", date:"Today",    guest:"Rahul K.",  email:"rahul@email.com",  size:2, occasion:"🌹 Date Night",  requests:"None",          pkg:"—",        status:"confirmed" },
  { id:"RB-006", time:"9:00 PM", date:"Today",    guest:"Emma W.",   email:"emma@email.com",   size:3, occasion:"🥂 Celebration", requests:"Vegan menu",    pkg:"—",        status:"confirmed" },
  { id:"RB-007", time:"7:00 PM", date:"Tomorrow", guest:"Liam B.",   email:"liam@email.com",   size:2, occasion:"—",              requests:"None",          pkg:"—",        status:"confirmed" },
  { id:"RB-008", time:"8:30 PM", date:"Tomorrow", guest:"Mia C.",    email:"mia@email.com",    size:4, occasion:"🎂 Birthday",    requests:"Balloons",      pkg:"Birthday", status:"pending"   },
];
