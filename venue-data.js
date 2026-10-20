const VENUE = {
  name: "Grand Meridian Theatre",
  world: { width: 1300, height: 900 },

  seat: { size: 24, gap: 4, aisleWidth: 24 },

  categories: {
    vip:       { label: "VIP Box",       price: 150, color: "#e11d8f" },
    premium:   { label: "Premium",       price: 110, color: "#8b5cf6" },
    standard:  { label: "Standard",      price: 75,  color: "#0ea5e9" },
    mezzanine: { label: "Mezzanine",     price: 55,  color: "#14b8a6" },
    economy:   { label: "Balcony",       price: 35,  color: "#f59e0b" }
  },

  stage: { x: 400, y: 18, width: 500, height: 64, label: "STAGE" },

  landmarks: [
    { label: "Main entrance", x: 560, y: 850, width: 180, height: 32 },
    { label: "Exit", x: 70, y: 400, width: 70, height: 28 },
    { label: "Exit", x: 1160, y: 400, width: 70, height: 28 }
  ],
  sections: [
    { id: "BXL", name: "Box Left",           category: "vip",       x: 184,  y: 130, rows: 8,  cols: 2,  rowStart: 0, curve: 0 },
    { id: "ORL", name: "Orchestra Left",     category: "standard",  x: 270,  y: 130, rows: 9,  cols: 5,  rowStart: 0, curve: 0 },
    { id: "ORF", name: "Orchestra Front",    category: "premium",   x: 454,  y: 130, rows: 5,  cols: 14, rowStart: 0, curve: 0 },
    { id: "ORR", name: "Orchestra Rear",     category: "standard",  x: 454,  y: 306, rows: 5,  cols: 14, rowStart: 5, curve: 0 },
    { id: "ORT", name: "Orchestra Right",    category: "standard",  x: 890,  y: 130, rows: 9,  cols: 5,  rowStart: 0, curve: 0 },
    { id: "BXR", name: "Box Right",          category: "vip",       x: 1060, y: 130, rows: 8,  cols: 2,  rowStart: 0, curve: 0 },
    { id: "MEZ", name: "Mezzanine",          category: "mezzanine", x: 360,  y: 500, rows: 5,  cols: 20, rowStart: 10, curve: 0.25, aisleAfter: [10] },
    { id: "BAL", name: "Balcony",            category: "economy",   x: 276,  y: 690, rows: 5,  cols: 26, rowStart: 15, curve: 0.2,  aisleAfter: [13] }
  ],

  unavailable: {
    seed: "grand-meridian-2026",
    ratio: 0.16,
    forced: ["ORF-A1", "ORF-A2", "ORF-C7", "BXL-A1"]
  }
};