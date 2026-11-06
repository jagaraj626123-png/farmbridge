(function () {
  const keys = {
    users: "farmbridge.users",
    products: "farmbridge.products",
    orders: "farmbridge.orders",
    cart: "farmbridge.cart",
    wishlist: "farmbridge.wishlist",
    reviews: "farmbridge.reviews",
    categories: "farmbridge.categories",
    preferences: "farmbridge.preferences"
  };
  const sampleProducts = [
    { id: "p1", name: "Tomatoes", category: "Fresh Vegetables", description: "Vine-ripened, hand-picked tomatoes from a family farm.", price: 32, stock: 180, unit: "kg", location: "Nashik, Maharashtra", farmer: "Meera Patil", farmerEmail: "meera@farmbridge.in", organic: true, harvestDate: "2026-11-05", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=85" },
    { id: "p2", name: "Alphonso Mangoes", category: "Fresh Fruits", description: "Naturally ripened Konkan Alphonso mangoes.", price: 145, stock: 65, unit: "kg", location: "Ratnagiri, Maharashtra", farmer: "Arjun Sawant", farmerEmail: "arjun@farmbridge.in", organic: false, harvestDate: "2026-11-04", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85" },
    { id: "p3", name: "Farm-fresh Spinach", category: "Fresh Vegetables", description: "Tender, nutrient-rich greens harvested this morning.", price: 28, stock: 95, unit: "kg", location: "Pune, Maharashtra", farmer: "Meera Patil", farmerEmail: "meera@farmbridge.in", organic: true, harvestDate: "2026-11-06", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=85" },
    { id: "p4", name: "Basmati Rice", category: "Rice and Grains", description: "Long-grain aromatic rice, carefully sun-dried.", price: 92, stock: 240, unit: "kg", location: "Karnal, Haryana", farmer: "Harpreet Singh", farmerEmail: "harpreet@farmbridge.in", organic: false, harvestDate: "2026-10-28", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=85" },
    { id: "p5", name: "Red Onions", category: "Fresh Vegetables", description: "A bold, kitchen-ready staple from our fields.", price: 36, stock: 300, unit: "kg", location: "Lasalgaon, Maharashtra", farmer: "Ravi Jadhav", farmerEmail: "ravi@farmbridge.in", organic: false, harvestDate: "2026-11-03", image: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=85" },
    { id: "p6", name: "Green Gram", category: "Pulses", description: "Protein-rich whole moong, cleaned and sorted.", price: 108, stock: 120, unit: "kg", location: "Indore, Madhya Pradesh", farmer: "Kavita Verma", farmerEmail: "kavita@farmbridge.in", organic: true, harvestDate: "2026-10-20", image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=85" },
    { id: "p7", name: "Turmeric Powder", category: "Spices", description: "Small-batch ground turmeric with a rich aroma.", price: 185, stock: 55, unit: "kg", location: "Erode, Tamil Nadu", farmer: "Lakshmi N", farmerEmail: "lakshmi@farmbridge.in", organic: true, harvestDate: "2026-10-15", image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f4?auto=format&fit=crop&w=900&q=85" },
    { id: "p8", name: "Organic Garden Seeds", category: "Seeds", description: "A seasonal mix for a thriving kitchen garden.", price: 75, stock: 80, unit: "pack", location: "Coimbatore, Tamil Nadu", farmer: "Lakshmi N", farmerEmail: "lakshmi@farmbridge.in", organic: true, harvestDate: "2026-10-10", image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=85" }
  ];
  const sampleUsers = [
    { id: "u1", name: "Meera Patil", email: "meera@farmbridge.in", role: "farmer", location: "Nashik, Maharashtra", joined: "2025-08-12" },
    { id: "u4", name: "Arjun Sawant", email: "arjun@farmbridge.in", role: "farmer", location: "Ratnagiri, Maharashtra", joined: "2025-07-14" },
    { id: "u5", name: "Harpreet Singh", email: "harpreet@farmbridge.in", role: "farmer", location: "Karnal, Haryana", joined: "2025-06-05" },
    { id: "u6", name: "Ravi Jadhav", email: "ravi@farmbridge.in", role: "farmer", location: "Lasalgaon, Maharashtra", joined: "2025-10-22" },
    { id: "u7", name: "Kavita Verma", email: "kavita@farmbridge.in", role: "farmer", location: "Indore, Madhya Pradesh", joined: "2025-08-19" },
    { id: "u8", name: "Lakshmi N", email: "lakshmi@farmbridge.in", role: "farmer", location: "Erode, Tamil Nadu", joined: "2025-04-17" },
    { id: "u2", name: "Aarav Sharma", email: "aarav@example.com", role: "customer", location: "Mumbai, Maharashtra", joined: "2025-09-10" }
  ];
  const seed = (key, value) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
  };
  seed(keys.users, sampleUsers);
  seed(keys.products, sampleProducts);
  seed(keys.orders, []);
  seed(keys.cart, []);
  seed(keys.wishlist, []);
  seed(keys.reviews, []);
  seed(keys.categories, ["Fresh Vegetables", "Fresh Fruits", "Rice and Grains", "Pulses", "Organic Products", "Spices", "Seeds", "Fertilizers", "Farming Equipment"]);
  seed(keys.preferences, {});

  function read(name) {
    try {
      const value = JSON.parse(localStorage.getItem(keys[name]) || "[]");
      return Array.isArray(value) || (name === "preferences" && value && typeof value === "object") ? value : [];
    } catch (error) {
      console.error("Could not read FarmBridge data:", name, error);
      return [];
    }
  }
  function write(name, value) {
    if (!keys[name]) throw new Error("Unknown FarmBridge data collection: " + name);
    localStorage.setItem(keys[name], JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("farmbridge:data", { detail: { collection: name } }));
    return value;
  }
  function upsert(name, item) {
    const rows = read(name);
    const index = rows.findIndex(row => row.id === item.id);
    if (index < 0) rows.unshift(item);
    else rows[index] = item;
    return write(name, rows);
  }
  function remove(name, id) {
    return write(name, read(name).filter(item => item.id !== id));
  }
  function id(prefix) {
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  window.FarmBridgeStore = { keys, read, write, upsert, remove, id };
})();
