(function () {
  const store = window.FarmBridgeStore;
  const auth = window.FarmBridgeAuth;
  const cookie = window.FarmBridgeCookies;
  const app = document.getElementById("app");
  const page = document.body.dataset.page || "home";
  const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const escape = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  window.FarmBridge = { escape };
  function productAvailable(product) {
    if (!product.farmerEmail) return true;
    const farmer = store.read("users").find(user => user.role === "farmer" && user.email === product.farmerEmail);
    return Boolean(farmer && farmer.isActive !== false);
  }
  function getAvailableCart() {
    const cart = store.read("cart");
    const available = cart.filter(item => {
      const product = store.read("products").find(row => row.id === item.productId);
      return product && productAvailable(product);
    });
    if (available.length !== cart.length) {
      store.write("cart", available);
      sessionStorage.setItem("farmbridge.activeCart", JSON.stringify(available));
    }
    return available;
  }

  function toast(message) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2800);
  }
  function transitionOrder(order, status) {
    if (order.status === status) return true;
    const products = store.read("products");
    let inventoryChanged = false;
    if (order.status === "Rejected" && status !== "Rejected") {
      for (const item of order.items) {
        const product = products.find(row => row.id === item.productId);
        if (product && product.stock < item.quantity) return false;
      }
      order.items.forEach(item => {
        const product = products.find(row => row.id === item.productId);
        if (product) { product.stock -= item.quantity; inventoryChanged = true; }
      });
    } else if (status === "Rejected" && ["Pending", "Accepted", "Packed"].includes(order.status)) {
      order.items.forEach(item => {
        const product = products.find(row => row.id === item.productId);
        if (product) { product.stock += item.quantity; inventoryChanged = true; }
      });
    }
    if (inventoryChanged) store.write("products", products);
    order.status = status;
    return true;
  }
  function nav() {
    const user = auth.current();
    const links = [
      ["Home", "index.html", "home"], ["Marketplace", "marketplace.html", "marketplace"],
      ["Farmers", "farmers.html", "farmers"], ["Market prices", "market-prices.html", "prices"],
      ["Services", "services.html", "services"], ["About", "about.html", "about"], ["Contact", "contact.html", "contact"],
      ["Log in", "login.html", "login"], ["Join", "register.html", "register"]
    ];
    return `<div class="topbar"><div class="container"><span>🌱 Growing a fairer food system, together</span><span>FarmBridge demo platform · India</span></div></div><header class="navbar"><div class="container nav-inner"><a class="brand" href="index.html"><span class="brand-mark">♧</span><span>FARMBRIDGE<small>INDIA · GROW TOGETHER</small></span></a><nav class="nav-links" id="nav-links">${links.map(([label, href, key]) => `<a class="${page === key ? "active" : ""}" href="${href}">${label}</a>`).join("")}</nav><div class="nav-actions"><form action="marketplace.html"><input class="nav-search" name="q" placeholder="Search produce…" aria-label="Search marketplace"></form><a class="icon-link" href="wishlist.html" aria-label="Wishlist"><i class="fa-regular fa-heart"></i><span class="badge">${store.read("wishlist").length}</span></a><a class="icon-link" href="cart.html" aria-label="Shopping cart"><i class="fa-solid fa-basket-shopping"></i><span class="badge">${store.read("cart").reduce((n, item) => n + item.quantity, 0)}</span></a>${user ? `<a class="login-link btn btn-outline btn-small" href="${auth.dashboard(user.role)}">${escape(user.name.split(" ")[0])}</a>` : `<a class="login-link btn btn-outline btn-small" href="login.html">Log in</a>`}<button class="menu-toggle" data-action="menu" aria-label="Toggle navigation"><i class="fa-solid fa-bars"></i></button></div></div></header>`;
  }
  function footer() {
    return `<footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="index.html"><span class="brand-mark">♧</span><span>FARMBRIDGE<small style="color:#c8df93">INDIA · GROW TOGETHER</small></span></a><p style="margin-top:17px">A more direct connection between the hands that grow our food and the people who enjoy it.</p><div style="display:flex;gap:15px;font-size:17px"><a href="https://instagram.com" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a><a href="https://facebook.com" aria-label="Facebook"><i class="fa-brands fa-facebook"></i></a><a href="https://linkedin.com" aria-label="LinkedIn"><i class="fa-brands fa-linkedin"></i></a></div></div><div><h3>Explore</h3><div class="footer-links"><a href="marketplace.html">Marketplace</a><a href="farmers.html">Our farmers</a><a href="market-prices.html">Market prices</a><a href="services.html">Services</a></div></div><div><h3>Join FarmBridge</h3><div class="footer-links"><a href="register.html?role=farmer">Sell your harvest</a><a href="register.html?role=customer">Shop local</a><a href="admin-login.html">Admin sign in</a><a href="orders.html">Track an order</a></div></div><div><h3>Get in touch</h3><div class="footer-links"><a href="contact.html">Contact us</a><a href="about.html">Our mission</a><a href="mailto:hello@farmbridge.in">hello@farmbridge.in</a><button class="btn btn-outline btn-small" data-action="theme">Toggle theme</button></div></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} FarmBridge India. Built for a better harvest.</span><span>Demo experience · No real payments or live market data</span></div></div></footer>`;
  }
  function cookieBanner() {
    if (cookie.get("farmbridge-consent")) return "";
    return `<aside class="cookie-banner" id="cookie-banner"><p><strong>Your privacy matters.</strong> We use cookies for preferences and recently viewed produce. Choose whether to allow optional cookies.</p><div class="cookie-actions"><button class="btn btn-outline btn-small" data-action="cookies-reject">Reject</button><button class="btn btn-small" data-action="cookies-accept">Accept</button></div></aside>`;
  }
  function shell(content) {
    app.innerHTML = nav() + content + footer() + cookieBanner();
    const theme = cookie.get("farmbridge-theme") || sessionStorage.getItem("farmbridge-theme") || store.read("preferences").theme;
    if (theme === "dark") document.body.classList.add("theme-dark");
  }
  function productCard(product) {
    const wished = store.read("wishlist").includes(product.id);
    const reviews = store.read("reviews").filter(review => review.productId === product.id);
    const rating = reviews.length ? ` · ★ ${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} (${reviews.length})` : "";
    return `<article class="product-card"><div class="product-img"><img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy"><span class="pill">${escape(product.category)}</span><button class="wishlist-btn" data-action="wishlist" data-id="${product.id}" aria-label="Add ${escape(product.name)} to wishlist">${wished ? "♥" : "♡"}</button></div><div class="product-info"><div class="farmer-line"><i class="fa-solid fa-location-dot"></i> ${escape(product.location || "India")}</div><h3>${escape(product.name)}</h3><div class="farmer-line">Grown by ${escape(product.farmer || "FarmBridge farmer")} ${product.organic ? "· Organic" : ""}${rating}</div><div class="card-bottom"><div class="product-price">${money(product.price)} <small>/ ${escape(product.unit || "kg")}</small></div><button class="btn btn-small" data-action="add-cart" data-id="${product.id}"><i class="fa-solid fa-plus"></i> Add</button></div><div class="meta"><span>${Number(product.stock)} ${escape(product.unit || "kg")} available</span><button class="filter-chip" data-action="view-product" data-id="${product.id}">Details</button></div></div></article>`;
  }
  function productGrid(products) {
    return products.length ? `<div class="product-grid">${products.map(productCard).join("")}</div>` : `<div class="empty-state panel">No matching produce found. Try a different search or category.</div>`;
  }
  function homePage() {
    const products = store.read("products").filter(productAvailable).slice(0, 4);
    const priceRows = priceData().slice(0, 4).map(row => `<tr><td><strong>${row.crop}</strong></td><td>${row.market}</td><td>${money(row.min)}</td><td>${money(row.max)}</td><td>${money(row.avg)}</td><td class="${row.change >= 0 ? "up" : "down"}">${row.change >= 0 ? "↑" : "↓"} ${Math.abs(row.change)}%</td></tr>`).join("");
    return `<main><section class="hero"><div class="container"><div class="hero-content"><span class="eyebrow">From Indian farms, with care</span><h1>A better harvest begins with a better connection.</h1><p>Meet the farmers behind your food. Buy fresher, sell fairer, and help every harvest find its home.</p><div class="hero-actions"><a class="btn btn-light" href="marketplace.html">Explore marketplace <i class="fa-solid fa-arrow-right"></i></a><a class="btn btn-outline" style="border-color:#d7e3d6;color:white" href="register.html?role=farmer">Join as a farmer</a></div><div class="hero-note"><div><strong>1,200+</strong>farmers growing with us</div><div><strong>18</strong>states connected</div><div><strong>Fairer</strong>farm-to-table trade</div></div></div></div></section><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Picked for you</span><h2>Fresh from the farm</h2></div><a class="btn btn-outline" href="marketplace.html">Shop all produce <i class="fa-solid fa-arrow-right"></i></a></div>${productGrid(products)}</div></section><section class="section section-soft"><div class="container"><div class="section-head"><div><span class="eyebrow">Simple by nature</span><h2>How FarmBridge works</h2></div><p>Technology that makes the journey from soil to table a little shorter, clearer and fairer.</p></div><div class="steps-grid"><article class="info-card"><div class="info-icon"><i class="fa-solid fa-seedling"></i></div><h3>Farmers list their harvest</h3><p>Growers share what is ready, how it was grown, and a fair price for their work.</p></article><article class="info-card"><div class="info-icon"><i class="fa-solid fa-basket-shopping"></i></div><h3>Buyers choose with confidence</h3><p>Browse local produce, learn who grew it and order directly from the source.</p></article><article class="info-card"><div class="info-icon"><i class="fa-solid fa-truck-fast"></i></div><h3>Good food finds its way</h3><p>Orders help coordinate a reliable hand-off and reduce avoidable food miles.</p></article></div></div></section><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Markets at a glance</span><h2>Daily mandi snapshot</h2></div><a href="market-prices.html" class="btn btn-outline">Explore demo prices</a></div><div class="notice">Illustrative sample data only — not live mandi prices. Always verify prices with your local market.</div><div style="overflow:auto"><table class="price-table"><thead><tr><th>Crop</th><th>Market</th><th>Min / kg</th><th>Max / kg</th><th>Average / kg</th><th>Change</th></tr></thead><tbody>${priceRows}</tbody></table></div></div></section><section class="section section-soft"><div class="container"><div class="section-head"><div><span class="eyebrow">Growing together</span><h2>Good for farms. Better for everyone.</h2></div></div><div class="benefit-grid"><article class="info-card"><div class="info-icon">🌾</div><h3>More value stays with growers</h3><p>Direct access to customers creates room for transparent pricing and lasting relationships.</p></article><article class="info-card"><div class="info-icon">🥬</div><h3>Freshness you can trace</h3><p>See the farm, the location and the harvest behind every basket you bring home.</p></article><article class="info-card"><div class="info-icon">♻️</div><h3>Less food goes to waste</h3><p>Better visibility into supply helps good produce reach the people who need it.</p></article></div></div></section><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Stories from the field</span><h2>Harvesting new possibilities</h2></div><a href="farmers.html">Meet our farmers →</a></div><div class="story-grid"><article class="story-card"><img src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=900&q=85" alt="Indian farmer working in a green field" loading="lazy"><div><span class="pill">Nashik, Maharashtra</span><h3>Meera Patil · Growing with purpose</h3><p>“A direct connection means I can plan better and spend more time on what I love — growing good food.”</p></div></article><article class="story-card"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85" alt="Golden light over a cultivated farm" loading="lazy"><div><span class="pill">Karnal, Haryana</span><h3>Harpreet Singh · A better grain story</h3><p>“Knowing where my produce goes makes every season feel more rewarding.”</p></div></article><article class="story-card"><img src="https://images.unsplash.com/photo-1523742815156-7edee6d35ca3?auto=format&fit=crop&w=900&q=85" alt="Farmer tending crops" loading="lazy"><div><span class="pill">Erode, Tamil Nadu</span><h3>Lakshmi N · Rooted in community</h3><p>“Small farms deserve a place in a modern marketplace. That’s what this makes possible.”</p></div></article></div></div></section><section class="section testimonials"><div class="container testimonial-grid"><div><span class="eyebrow" style="color:#c8df93">A shared table</span><h2>“Good food should have a good story behind it.”</h2><p class="quote">FarmBridge helps customers discover the people and care behind their everyday ingredients — and helps farmers build real connections beyond the field.</p><p><strong>— The FarmBridge community</strong><br>Growers and customers, growing together</p></div><img class="testimonial-image" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=85" alt="Colorful fresh produce at a farm market" loading="lazy"></div></section></main>`;
  }
  function pageHero(title, subtitle, eyebrow) {
    return `<section class="page-hero"><div class="container"><div><span class="eyebrow">${eyebrow || "FarmBridge India"}</span><h1>${title}</h1><p>${subtitle}</p></div><a class="btn" href="marketplace.html">Explore marketplace <i class="fa-solid fa-arrow-right"></i></a></div></section>`;
  }
  function marketplacePage() {
    const params = new URLSearchParams(location.search);
    const saved = JSON.parse(sessionStorage.getItem("farmbridge.filters") || "{}");
    const query = params.get("q") || saved.query || "";
    const category = saved.category || "";
    const locationFilter = saved.location || "";
    const maxPrice = saved.maxPrice || "";
    const categories = store.read("categories");
    const products = store.read("products").filter(product => {
      const text = (product.name + " " + product.description + " " + product.farmer + " " + product.location).toLowerCase();
      return productAvailable(product) && (!query || text.includes(query.toLowerCase())) && (!category || product.category === category) && (!locationFilter || product.location.toLowerCase().includes(locationFilter.toLowerCase())) && (!maxPrice || Number(product.price) <= Number(maxPrice));
    });
    const recent = (cookie.get("farmbridge-recent") || "").split(",").filter(Boolean).map(id => store.read("products").find(product => product.id === id)).filter(Boolean);
    return `${pageHero("The farm is closer than you think.", "Shop seasonal produce, pantry staples and farm essentials from growers you can know by name.", "Farm-to-table marketplace")}<main class="section"><div class="container"><div class="toolbar"><input id="market-search" value="${escape(query)}" placeholder="Search produce or farmer…" aria-label="Search products"><select id="category-filter"><option value="">All categories</option>${categories.map(item => `<option ${category === item ? "selected" : ""}>${escape(item)}</option>`).join("")}</select><input id="location-filter" value="${escape(locationFilter)}" placeholder="Farmer location"><input id="price-filter" type="number" min="0" value="${escape(maxPrice)}" placeholder="Max price ₹"><button class="btn" data-action="apply-filters">Find produce</button><button class="btn btn-outline" data-action="clear-filters">Clear</button></div><div class="filter-chips">${categories.map(item => `<button class="filter-chip ${item === category ? "active" : ""}" data-action="category-chip" data-category="${escape(item)}">${escape(item)}</button>`).join("")}</div><p>${products.length} products from FarmBridge growers</p>${productGrid(products)}${recent.length ? `<section style="margin-top:60px"><div class="section-head"><div><span class="eyebrow">Picked up again</span><h2>Recently viewed</h2></div></div>${productGrid(recent)}</section>` : ""}</div></main>`;
  }
  function priceData() {
    return [
      { crop: "Tomato", market: "Nashik APMC", place: "Nashik", min: 24, max: 38, avg: 31, change: 3.2 },
      { crop: "Onion", market: "Lasalgaon APMC", place: "Nashik", min: 28, max: 43, avg: 35, change: -1.4 },
      { crop: "Potato", market: "Azadpur Mandi", place: "Delhi", min: 20, max: 32, avg: 26, change: 2.1 },
      { crop: "Wheat", market: "Karnal Grain Market", place: "Karnal", min: 25, max: 31, avg: 28, change: 0.8 },
      { crop: "Basmati Rice", market: "Karnal Grain Market", place: "Karnal", min: 78, max: 112, avg: 94, change: 1.6 },
      { crop: "Green Gram", market: "Indore Mandi", place: "Indore", min: 92, max: 124, avg: 108, change: -0.5 },
      { crop: "Banana", market: "Vashi APMC", place: "Mumbai", min: 30, max: 48, avg: 39, change: 2.7 },
      { crop: "Turmeric", market: "Erode Market", place: "Erode", min: 145, max: 205, avg: 176, change: 1.2 }
    ];
  }
  function pricesPage() {
    const locationFilter = sessionStorage.getItem("farmbridge.priceLocation") || "";
    const rows = priceData().filter(row => !locationFilter || row.place.toLowerCase().includes(locationFilter.toLowerCase()) || row.market.toLowerCase().includes(locationFilter.toLowerCase())).map(row => `<tr><td><strong>${row.crop}</strong></td><td>${row.market}</td><td>${money(row.min)}</td><td>${money(row.max)}</td><td>${money(row.avg)}</td><td class="${row.change >= 0 ? "up" : "down"}">${row.change >= 0 ? "↑" : "↓"} ${Math.abs(row.change)}%</td></tr>`).join("");
    return `${pageHero("Know your market. Plan your next move.", "Compare indicative crop prices across sample markets to support more informed decisions.", "Market intelligence")}<main class="section"><div class="container"><div class="notice"><strong>Sample / demo data — not real-time.</strong> These illustrative values are not official mandi quotations or financial advice. Confirm prices directly with local markets before trading.</div><div class="toolbar"><input id="price-location" value="${escape(locationFilter)}" placeholder="Search by market or location"><button class="btn" data-action="price-search">Search markets</button><button class="btn btn-outline" data-action="clear-price-search">Clear</button><span class="pill">Sample updated: 6 Nov 2026</span></div><div style="overflow:auto"><table class="price-table"><thead><tr><th>Crop</th><th>Sample market</th><th>Minimum / kg</th><th>Maximum / kg</th><th>Average / kg</th><th>Illustrative change</th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="empty-state">No sample markets match that location.</td></tr>`}</tbody></table></div><div class="section-head" style="margin-top:55px"><div><span class="eyebrow">Compare markets</span><h2>One crop, different markets</h2></div><p>Example comparison for tomatoes. Values are illustrative demo data only.</p></div><div class="steps-grid">${[["Nashik APMC","₹24–38/kg"],["Pune Market Yard","₹28–42/kg"],["Vashi APMC","₹30–45/kg"]].map(item => `<div class="info-card"><span class="pill">DEMO · TOMATO</span><h3 style="margin-top:13px">${item[0]}</h3><strong style="font:800 22px Manrope;color:var(--green)">${item[1]}</strong><p style="margin:5px 0 0">Illustrative minimum–maximum</p></div>`).join("")}</div></div></main>`;
  }
  function farmersPage() {
    const farmers = store.read("users").filter(user => user.role === "farmer" && user.isActive !== false);
    const images = ["photo-1594708767771-a7502209ff51", "photo-1523742815156-7edee6d35ca3", "photo-1500382017468-9049fed747ef"];
    return `${pageHero("People at the heart of every harvest.", "Meet growers who bring care, craft and a deep connection to their land to every crop.", "Our farming community")}<main class="section"><div class="container"><div class="story-grid">${farmers.map((farmer, index) => `<article class="story-card"><img src="https://images.unsplash.com/${images[index % images.length]}?auto=format&fit=crop&w=900&q=85" alt="FarmBridge farmer in the field" loading="lazy"><div><span class="pill">${escape(farmer.location || "India")}</span><h3>${escape(farmer.name)}</h3><p>Independent grower bringing fresh, thoughtfully grown produce to the FarmBridge community.</p><a class="btn btn-outline btn-small" href="marketplace.html?q=${encodeURIComponent(farmer.name)}">Shop this farmer</a></div></article>`).join("") || `<div class="empty-state">Our grower community is just getting started.</div>`}</div><section class="section" style="padding-bottom:0"><div class="container" style="padding:0"><div class="info-card" style="display:flex;justify-content:space-between;align-items:center;gap:20px"><div><span class="eyebrow">Your farm belongs here</span><h2>Ready to grow your reach?</h2><p>Build your storefront and connect with nearby buyers.</p></div><a class="btn" href="register.html?role=farmer">Join as a farmer</a></div></div></section></div></main>`;
  }
  function aboutPage() {
    return `${pageHero("A bridge between the people who grow and the people who eat.", "FarmBridge India is a digital agriculture ecosystem built around fair opportunity, fresh food and stronger local connections.", "Our purpose")}<main><section class="section"><div class="container testimonial-grid"><div><span class="eyebrow">Why FarmBridge</span><h2>Good agriculture is a community effort.</h2><p>We believe the future of food works better when farmers have more choices, buyers have more trust, and local businesses can grow alongside the farms that feed them.</p><p>Our platform brings growers, households, wholesale buyers, service providers and delivery partners into one accessible digital marketplace.</p><a class="btn" href="register.html">Be part of the bridge</a></div><img class="testimonial-image" src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85" alt="Sunrise over fields"></div></section><section class="section section-soft"><div class="container"><div class="benefit-grid"><article class="info-card"><h3>Fairness</h3><p>Transparent listings and direct discovery can give farmers more agency in how they sell.</p></article><article class="info-card"><h3>Freshness</h3><p>Shorter, clearer supply chains help customers find food closer to harvest.</p></article><article class="info-card"><h3>Resilience</h3><p>Better access to markets and services supports stronger rural businesses.</p></article></div></div></section></main>`;
  }
  function servicesPage() {
    return `${pageHero("Practical support for a thriving farm.", "Explore services, information and tools designed for the people who keep agriculture moving.", "Beyond the marketplace")}<main class="section"><div class="container"><div class="service-grid"><article class="info-card"><div class="info-icon">☀️</div><h3>Weather outlook · Demo</h3><p>Sample conditions for Nashik: partly sunny, 29°C, light breeze. Demo only; check an official local forecast before planning farm work.</p><span class="pill">Illustrative interface</span></article><article class="info-card"><div class="info-icon">🚚</div><h3>Transport connections</h3><p>Connect harvest-ready sellers with local delivery and transport partners for pickup coordination.</p><a class="btn btn-outline btn-small" href="contact.html?topic=transport">Request a transport introduction</a></article><article class="info-card"><div class="info-icon">📦</div><h3>Wholesale purchasing</h3><p>Restaurants, retailers and bulk buyers can reach growers for larger seasonal orders.</p><a class="btn btn-outline btn-small" href="register.html?role=customer">Join as a buyer</a></article><article class="info-card"><div class="info-icon">🛡️</div><h3>Crop health library</h3><p>For yellowing leaves, leaf spots or wilting, take clear photos and consult a qualified local agricultural officer before treatment.</p><a href="https://farmer.gov.in/" target="_blank" rel="noopener">Explore farmer resources →</a></article><article class="info-card"><div class="info-icon">🏛️</div><h3>Government schemes</h3><p>Explore official information on PM-KISAN, soil health and other farmer support programmes. Eligibility and status should be verified with official sources.</p><a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener">Visit myScheme.gov.in →</a></article><article class="info-card"><div class="info-icon">📚</div><h3>Field notes</h3><p>Plan harvests around demand, handle produce gently, keep simple cost records and use clean, ventilated storage.</p><span class="pill">Farmer learning</span></article></div><section class="section" style="padding-bottom:0"><div class="info-card" style="background:#edf4e6"><span class="eyebrow">A better use for every harvest</span><h2>Reduce food waste, one good connection at a time.</h2><p>List surplus produce early, share harvest windows with local buyers, and explore donation or community food programmes for food that cannot be sold in time.</p><a class="btn" href="marketplace.html">Find local buyers</a></div></section></div></main>`;
  }
  function contactPage() {
    const topic = new URLSearchParams(location.search).get("topic");
    const selectedTopic = topic === "transport" ? "Transport partnership" : topic === "wholesale" ? "Wholesale enquiry" : "General question";
    return `${pageHero("Let’s grow something good together.", "Have a question, partnership idea or need a hand getting started? We’d love to hear from you.", "Get in touch")}<main class="section"><div class="container contact-layout"><div><h2>We’re here to help.</h2><p>Reach our demo team about farmer onboarding, wholesale buying, delivery partnerships or platform support.</p><div class="info-card"><h3><i class="fa-regular fa-envelope"></i> Email</h3><a href="mailto:hello@farmbridge.in">hello@farmbridge.in</a><p style="margin-top:15px">This is a demo contact interface. Messages stay in this browser.</p></div></div><form class="panel" id="contact-form"><h3>Send a message</h3><div class="form-grid"><div class="form-field"><label for="contact-name">Your name</label><input id="contact-name" name="name" required></div><div class="form-field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" required></div><div class="form-field full"><label for="contact-topic">How can we help?</label><select id="contact-topic" name="topic">${["General question", "Farmer onboarding", "Wholesale enquiry", "Transport partnership", "Platform support"].map(option => `<option ${selectedTopic === option ? "selected" : ""}>${option}</option>`).join("")}</select></div><div class="form-field full"><label for="contact-message">Message</label><textarea id="contact-message" name="message" rows="5" required></textarea></div></div><button class="btn">Send message</button></form></div></main>`;
  }
  function authPage(register) {
    const params = new URLSearchParams(location.search);
    const roleDefault = params.get("role") || "customer";
    return `<main class="auth-wrap"><section class="auth-card"><span class="eyebrow">${register ? "Join the community" : "Welcome back"}</span><h2>${register ? "Create your FarmBridge account" : "Sign in to FarmBridge"}</h2><p>${register ? "Choose your role and start growing with us." : "A demo sign-in — no password is stored or sent."}</p><div class="notice">Demo authentication only. Use a valid email and a password of at least 8 characters. Never use a real or reused password here.</div><form id="${register ? "register-form" : "login-form"}"><div class="form-field"><label for="auth-role">I am a</label><select id="auth-role" name="role" required>${(register ? ["customer", "farmer"] : ["customer", "farmer"]).map(role => `<option value="${role}" ${roleDefault === role ? "selected" : ""}>${role[0].toUpperCase() + role.slice(1)}</option>`).join("")}</select></div>${register ? `<div class="form-field"><label for="auth-name">Full name</label><input id="auth-name" name="name" autocomplete="name" required minlength="2"></div>` : ""}<div class="form-field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" required></div>${register ? `<div class="form-field"><label for="auth-location">Location</label><input id="auth-location" name="location" placeholder="City, State" required></div>` : ""}<div class="form-field"><label for="auth-password">Password ${register ? "(8+ characters)" : ""}</label><div class="password-wrap"><input id="auth-password" name="password" type="password" minlength="8" autocomplete="${register ? "new-password" : "current-password"}" required><button type="button" data-action="toggle-password" aria-label="Show password"><i class="fa-regular fa-eye"></i></button></div></div>${register ? `<div class="form-field"><label for="auth-confirm">Confirm password</label><input id="auth-confirm" name="confirm" type="password" minlength="8" required></div>` : ""}<button class="btn" style="width:100%;margin-top:8px">${register ? "Create account" : "Sign in"} <i class="fa-solid fa-arrow-right"></i></button></form><p style="margin:18px 0 0;font-size:13px">${register ? "Already with us?" : "New to FarmBridge?"} <a style="color:var(--green);font-weight:700" href="${register ? "login.html" : "register.html"}">${register ? "Sign in" : "Create an account"}</a></p>${!register ? `<p style="margin-top:10px;font-size:12px">Administrator? <a style="color:var(--green);font-weight:700" href="admin-login.html">Use the separate admin login</a></p>` : ""}</section></main>`;
  }
  function adminLoginPage() {
    if (auth.adminCurrent()) location.replace("admin.html");
    return `<main class="admin-login-wrap"><div class="admin-login-aside"><a class="brand" href="index.html"><span class="brand-mark">♧</span><span>FARMBRIDGE<small style="color:#d5e8bc">INDIA · ADMINISTRATION</small></span></a><div><span class="eyebrow" style="color:#d5e8bc">FarmBridge operations</span><h1>Better connections need thoughtful care.</h1><p>Manage the people, produce and orders that keep our farming community moving.</p><div class="admin-login-points"><span><i class="fa-solid fa-shield-halved"></i> Dedicated admin session</span><span><i class="fa-solid fa-chart-line"></i> Platform insights</span><span><i class="fa-solid fa-seedling"></i> Grower-first tools</span></div></div><p class="admin-demo-label">DEMO CONSOLE · FRONTEND-ONLY AUTHENTICATION</p></div><section class="admin-login-panel"><div class="admin-login-card"><span class="admin-lock"><i class="fa-solid fa-lock"></i></span><span class="eyebrow">Administrator access</span><h2>Sign in to your console</h2><p>Use the dedicated demo admin credentials to continue.</p><form id="admin-login-form"><div class="form-field"><label for="admin-email">Admin email</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div><div class="form-field"><label for="admin-password">Password</label><div class="password-wrap"><input id="admin-password" name="password" type="password" autocomplete="current-password" required><button type="button" data-action="toggle-admin-password" aria-label="Show password"><i class="fa-regular fa-eye"></i></button></div></div><p id="admin-login-error" class="admin-error" role="alert" hidden>Incorrect admin email or password. Please try again.</p><button class="btn" style="width:100%">Secure demo sign in <i class="fa-solid fa-arrow-right"></i></button></form><div class="notice">Demo-only admin login. Session storage is temporary; frontend checks are not production security. Implement server-side authentication and role authorization before deployment.</div><a class="admin-back-link" href="index.html">← Back to FarmBridge</a></div></section></main>`;
  }
  function cartPage() {
    const cart = getAvailableCart();
    const rows = cart.map(item => {
      const product = store.read("products").find(row => row.id === item.productId);
      if (!product) return "";
      return `<div class="cart-row"><img src="${escape(product.image)}" alt="${escape(product.name)}"><div style="flex:1"><strong>${escape(product.name)}</strong><div class="farmer-line">${escape(product.farmer)} · ${money(product.price)} / ${escape(product.unit || "kg")}</div></div><input class="qty-input" type="number" min="1" max="${Number(product.stock)}" value="${Number(item.quantity)}" aria-label="Quantity" data-action="cart-quantity" data-id="${product.id}"><strong>${money(product.price * item.quantity)}</strong><button class="btn btn-outline btn-small" data-action="remove-cart" data-id="${product.id}">Remove</button></div>`;
    }).filter(Boolean).join("");
    const total = cart.reduce((sum, item) => { const product = store.read("products").find(row => row.id === item.productId); return sum + (product ? product.price * item.quantity : 0); }, 0);
    return `${pageHero("Your basket, closer to the farm.", "Review your fresh picks before you check out.", "Shopping cart")}<main class="section"><div class="container cart-layout"><section class="panel"><div class="panel-head"><h3>Your items (${cart.reduce((n, item) => n + item.quantity, 0)})</h3><a href="marketplace.html">Continue shopping</a></div>${rows || `<div class="empty-state">Your basket is waiting for something fresh.<br><br><a class="btn" href="marketplace.html">Explore produce</a></div>`}</section><aside class="panel"><h3>Order summary</h3><p>Items subtotal <strong style="float:right">${money(total)}</strong></p><p>Delivery <strong style="float:right">Arranged with seller</strong></p><hr style="border:0;border-top:1px solid var(--line)"><h3>Total <span style="float:right;color:var(--green)">${money(total)}</span></h3><div class="notice">Demo checkout only. No real payment is collected.</div><a class="btn" style="width:100%;${cart.length ? "" : "pointer-events:none;opacity:.5"}" href="checkout.html">Continue to checkout</a></aside></div></main>`;
  }
  function wishlistPage() {
    const ids = store.read("wishlist");
    const products = store.read("products").filter(product => ids.includes(product.id) && productAvailable(product));
    return `${pageHero("Saved for a little later.", "Your wishlist keeps your favourite farms and finds close at hand.", "Your wishlist")}<main class="section"><div class="container">${productGrid(products)}</div></main>`;
  }
  function checkoutPage() {
    const user = auth.current();
    if (!user) return `${pageHero("Checkout", "Sign in to place your demo order.", "Shopping cart")}<main class="section container"><div class="panel"><h2>Sign in to continue</h2><p>Your cart is saved in this browser.</p><a class="btn" href="login.html">Sign in</a></div></main>`;
    const cart = getAvailableCart();
    const total = cart.reduce((sum, item) => { const product = store.read("products").find(row => row.id === item.productId); return sum + (product ? product.price * item.quantity : 0); }, 0);
    const progress = JSON.parse(sessionStorage.getItem("farmbridge.checkout") || "{}");
    const checkoutParams = new URLSearchParams(location.search);
    const orderId = checkoutParams.get("order");
    if (checkoutParams.get("payment") === "failed") return `${pageHero("Demo payment wasn’t completed.", "No payment was taken and your basket is unchanged. You can try again whenever you’re ready.", "Payment not completed")}<main class="section container"><div class="panel" style="text-align:center"><div class="info-icon" style="margin:0 auto 15px">↻</div><h2>Nothing was charged</h2><p>This is a simulated failure screen. Your demo cart remains saved.</p><a class="btn" href="checkout.html">Try checkout again</a> <a class="btn btn-outline" href="cart.html">Review basket</a></div></main>`;
    if (orderId) {
      const order = store.read("orders").find(item => item.id === orderId);
      if (order) return `${pageHero("Your order is confirmed.", "Thank you for supporting local growers. Your demo order is saved in this browser.", "Order placed")}<main class="section container"><div class="panel" style="text-align:center"><div class="info-icon" style="margin:0 auto 15px">✓</div><h2>${order.payment === "Cash on Delivery" ? "Order " + escape(order.id.slice(-8).toUpperCase()) : "Demo payment successful"}</h2><p>Demo payment: ${escape(order.payment)} · Status: ${escape(order.status)}</p><p>Total ${money(order.total)}</p><a class="btn" href="orders.html">Track your order</a></div></main>`;
    }
    if (!cart.length) return `${pageHero("Nothing to check out just yet.", "Add fresh produce to your basket before placing an order.", "Checkout")}<main class="section container"><a class="btn" href="marketplace.html">Browse marketplace</a></main>`;
    return `${pageHero("A few final details.", "This demo checkout creates a local order without collecting real payment information.", "Secure demo checkout")}<main class="section"><div class="container cart-layout"><form class="panel" id="checkout-form"><h3>Delivery details</h3><div class="form-field"><label for="delivery-name">Recipient name</label><input id="delivery-name" name="name" value="${escape(user.name)}" required></div><div class="form-field"><label for="delivery-phone">Phone number</label><input id="delivery-phone" name="phone" type="tel" pattern="[0-9]{8,16}" required placeholder="10-digit mobile number"></div><div class="form-field"><label for="delivery-address">Delivery address</label><textarea id="delivery-address" name="address" rows="3" required>${escape(progress.address || user.location || "")}</textarea></div><h3 style="margin-top:24px">Demo payment method</h3><label class="payment-option"><input type="radio" name="payment" value="Cash on Delivery" checked> Cash on Delivery (demo)</label><label class="payment-option"><input type="radio" name="payment" value="UPI demo"> UPI demo (no transaction)</label><label class="payment-option"><input type="radio" name="payment" value="Card demo"> Card demo (no card data collected)</label><div class="notice">No real charges, UPI requests or card processing occur. Never enter payment credentials.</div><button class="btn" ${cart.length ? "" : "disabled"}>Place demo order · ${money(total)}</button><button type="button" class="btn btn-outline btn-small" style="margin-left:8px" data-action="simulate-payment-failure">Preview failure screen</button></form><aside class="panel"><h3>Order summary</h3>${cart.map(item => { const product = store.read("products").find(row => row.id === item.productId); return product ? `<p>${escape(product.name)} × ${item.quantity}<strong style="float:right">${money(product.price * item.quantity)}</strong></p>` : ""; }).join("")}<hr style="border:0;border-top:1px solid var(--line)"><h3>Total ${money(total)}</h3></aside></div></main>`;
  }
  function ordersPage() {
    const user = auth.current();
    if (!user) return `${pageHero("Your orders", "Sign in to see order history and delivery progress.", "Order tracking")}<main class="section container"><a class="btn" href="login.html">Sign in</a></main>`;
    let orders = store.read("orders");
    if (user.role === "customer") orders = orders.filter(order => order.customerEmail === user.email);
    else if (user.role === "farmer") orders = orders.filter(order => order.items.some(item => item.farmerEmail === user.email));
    const rows = orders.length ? orders.map(order => `<tr><td>#${escape(order.id.slice(-8).toUpperCase())}</td><td>${new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td>${order.items.map(item => `${escape(item.name)} × ${item.quantity}`).join("<br>")}</td><td>${money(order.total)}</td><td>${escape(order.payment)}</td><td><span class="status ${order.status.toLowerCase()}">${escape(order.status)}</span></td>${user.role === "customer" ? `<td><button class="btn btn-outline btn-small" data-action="review-order" data-id="${order.id}">Review</button></td>` : ""}</tr>`).join("") : `<tr><td colspan="7" class="empty-state">No orders to show yet. Your next favourite harvest is waiting.</td></tr>`;
    return `${pageHero("Every good order has a story.", "Track your demo orders and see how your support reaches local farms.", "Order history")}<main class="section"><div class="container"><div class="notice">All orders are demo records stored only in this browser.</div><div class="panel" style="overflow:auto"><table class="data-table"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th>${user.role === "customer" ? "<th>Review</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div></div></main>`;
  }
  function dashboardPage() {
    const user = auth.current();
    const expected = page === "admin" ? "admin" : page === "farmer-dashboard" ? "farmer" : "customer";
    if (expected === "admin") return auth.adminCurrent() ? window.FarmBridgeAdmin.render() : "";
    if (!user || user.role !== expected) return `${pageHero("Your workspace is one step away.", "Sign in with the right demo role to continue.", "FarmBridge dashboard")}<main class="section container"><div class="panel"><a class="btn" href="login.html?role=${expected}">Sign in as ${expected}</a></div></main>`;
    if (expected === "farmer") {
      const account = store.read("users").find(item => item.id === user.id);
      if (account && account.isActive === false) {
        auth.signOut();
        return "";
      }
    }
    if (expected === "farmer") return window.FarmBridgeFarmer.render(user);
    if (expected === "customer") return window.FarmBridgeCustomer.render(user);
    return window.FarmBridgeAdmin.render();
  }
  function render() {
    if (page === "admin" && !auth.adminCurrent()) {
      location.replace("admin-login.html");
      return;
    }
    if (page === "admin-login" && auth.adminCurrent()) {
      location.replace("admin.html");
      return;
    }
    const pages = {
      home: homePage, marketplace: marketplacePage, farmers: farmersPage, prices: pricesPage,
      services: servicesPage, about: aboutPage, contact: contactPage,
      login: () => authPage(false), register: () => authPage(true), "admin-login": adminLoginPage, cart: cartPage,
      wishlist: wishlistPage, checkout: checkoutPage, orders: ordersPage,
      "farmer-dashboard": dashboardPage, "customer-dashboard": dashboardPage, admin: dashboardPage
    };
    if (page === "admin-login") app.innerHTML = adminLoginPage();
    else shell((pages[page] || homePage)());
    if (page === "admin") window.requestAnimationFrame(() => {
      window.FarmBridgeAdmin.filters();
      window.FarmBridgeAdmin.charts();
    });
  }
  function modal(content) {
    const old = document.querySelector(".modal-backdrop");
    if (old) old.remove();
    app.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true">${content}<div style="text-align:right;margin-top:12px"><button class="btn btn-outline btn-small" data-action="close-modal">Cancel</button></div></section></div>`);
  }
  function productForm(product) {
    const edit = Boolean(product);
    const user = auth.current();
    const isAdmin = page === "admin" && Boolean(auth.adminCurrent());
    const categories = store.read("categories");
    modal(`<span class="eyebrow">${edit ? "Update listing" : "New harvest"}</span><h2>${edit ? "Edit product" : "Add a product"}</h2><form id="product-form" data-id="${edit ? escape(product.id) : ""}"><div class="form-grid"><div class="form-field"><label>Product name</label><input name="name" required value="${escape(product?.name || "")}"></div><div class="form-field"><label>Category</label><select name="category" required>${categories.map(item => `<option ${product?.category === item ? "selected" : ""}>${escape(item)}</option>`).join("")}</select></div><div class="form-field full"><label>Description</label><textarea name="description" rows="2" required>${escape(product?.description || "")}</textarea></div>${isAdmin ? `<div class="form-field"><label>Farmer name</label><input name="farmer" required value="${escape(product?.farmer || "")}"></div><div class="form-field"><label>Farmer email</label><input name="farmerEmail" type="email" value="${escape(product?.farmerEmail || "")}"></div>` : ""}<div class="form-field"><label>Price (₹ / unit)</label><input name="price" type="number" min="0.01" step="0.01" required value="${escape(product?.price || "")}"></div><div class="form-field"><label>Available quantity</label><input name="stock" type="number" min="0" required value="${escape(product?.stock || "")}"></div><div class="form-field"><label>Unit</label><select name="unit">${["kg", "pack", "piece", "quintal"].map(unit => `<option ${product?.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}</select></div><div class="form-field"><label>Harvest date</label><input name="harvestDate" type="date" value="${escape(product?.harvestDate || "")}"></div><div class="form-field"><label>Farm location</label><input name="location" required value="${escape(product?.location || user?.location || "")}"></div><div class="form-field"><label>Product image URL (optional)</label><input name="imageUrl" type="url" placeholder="https://…" value="${escape(product?.image || "")}"></div><div class="form-field"><label>Upload product image (optional)</label><input name="imageFile" type="file" accept="image/*"></div><div class="form-field full"><label><input name="organic" type="checkbox" ${product?.organic ? "checked" : ""}> Grown using organic practices</label></div></div><p class="farmer-line">Image uploads are limited to 1 MB and saved in this browser only.</p><button class="btn">${edit ? "Save changes" : "Publish product"}</button></form>`);
  }
  function userForm(user, role) {
    const userRole = user?.role || role || "customer";
    modal(`<span class="eyebrow">Platform users</span><h2>${user ? "Edit " + escape(userRole) : "Add " + escape(userRole)}</h2><form id="user-form" data-id="${user ? escape(user.id) : ""}" data-role="${escape(userRole)}"><div class="form-field"><label>Name</label><input name="name" required value="${escape(user?.name || "")}"></div><div class="form-field"><label>Email</label><input name="email" type="email" required value="${escape(user?.email || "")}"></div><input type="hidden" name="role" value="${escape(userRole)}"><div class="form-field"><label>Location</label><input name="location" value="${escape(user?.location || "")}"></div>${userRole === "farmer" ? `<div class="form-field"><label><input name="isActive" type="checkbox" ${user?.isActive !== false ? "checked" : ""}> Farmer account is active</label></div>` : ""}<button class="btn">Save user</button></form>`);
  }
  function categoryForm(category) {
    modal(`<span class="eyebrow">Product taxonomy</span><h2>${category ? "Edit category" : "Add category"}</h2><form id="category-form" data-original="${category ? escape(category) : ""}"><div class="form-field"><label>Category name</label><input name="name" required maxlength="60" value="${escape(category || "")}"></div><button class="btn">Save category</button></form>`);
  }
  function profileForm(user) {
    modal(`<span class="eyebrow">Your account</span><h2>Edit profile</h2><form id="profile-form"><div class="form-field"><label>Name</label><input name="name" required value="${escape(user.name)}"></div><div class="form-field"><label>Email</label><input name="email" type="email" required value="${escape(user.email)}"></div><div class="form-field"><label>Location</label><input name="location" value="${escape(user.location)}"></div><button class="btn">Save profile</button></form>`);
  }
  function filterAdminTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const search = document.querySelector(`[data-filter-table="${tableId}"].admin-search`);
    const query = search ? search.value.trim().toLowerCase() : "";
    const filters = [...document.querySelectorAll(`[data-filter-table="${tableId}"][data-filter-property]`)];
    table.querySelectorAll("tr").forEach(row => {
      if (!row.cells.length) return;
      const matchesQuery = !query || (row.dataset.search || row.textContent).toLowerCase().includes(query);
      const matchesFilters = filters.every(filter => {
        if (!filter.value) return true;
        const cell = filter.dataset.filterProperty === "active" ? row.cells[3]?.querySelector(".status") : filter.dataset.filterProperty === "status" ? row.cells[4]?.querySelector("select") : row.cells[2];
        const value = filter.dataset.filterProperty === "active" ? String(cell?.textContent.trim() === "Active") : cell?.value || cell?.textContent.trim() || "";
        return value === filter.value;
      });
      row.hidden = !(matchesQuery && matchesFilters);
    });
  }
  function rerender() { render(); }
  app.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button || (button.classList.contains("modal-backdrop") && event.target !== button)) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (page === "admin" && !auth.adminCurrent()) {
      location.replace("admin-login.html");
      return;
    }
    if (action === "menu") document.getElementById("nav-links").classList.toggle("open");
    if (action === "add-cart") {
      const product = store.read("products").find(item => item.id === id);
      if (!product || product.stock < 1) return toast("This product is currently out of stock.");
      const cart = store.read("cart");
      const entry = cart.find(item => item.productId === id);
      if (entry && entry.quantity >= product.stock) return toast("You’ve reached the available stock for this product.");
      if (entry) entry.quantity += 1; else cart.push({ productId: id, quantity: 1 });
      store.write("cart", cart); sessionStorage.setItem("farmbridge.activeCart", JSON.stringify(cart));
      toast(product.name + " added to your basket.");
      if (page === "cart" || page === "checkout") render(); else { const badge = document.querySelector(".nav-actions .badge:last-of-type"); if (badge) badge.textContent = cart.reduce((n, item) => n + item.quantity, 0); }
    }
    if (action === "wishlist") {
      const list = store.read("wishlist");
      if (list.includes(id)) store.write("wishlist", list.filter(item => item !== id));
      else { list.push(id); store.write("wishlist", list); }
      toast(list.includes(id) ? "Saved to your wishlist." : "Removed from your wishlist.");
      render();
    }
    if (action === "remove-cart") { store.write("cart", store.read("cart").filter(item => item.productId !== id)); render(); }
    if (action === "view-product") {
      if (cookie.get("farmbridge-consent") === "accepted") {
        const recent = (cookie.get("farmbridge-recent") || "").split(",").filter(Boolean).filter(item => item !== id);
        recent.unshift(id); cookie.set("farmbridge-recent", recent.slice(0, 5).join(","), 30);
      }
      const product = store.read("products").find(item => item.id === id);
      if (product) toast(`${product.name} · grown by ${product.farmer} in ${product.location}`);
    }
    if (action === "apply-filters") {
      sessionStorage.setItem("farmbridge.filters", JSON.stringify({ query: document.getElementById("market-search").value.trim(), category: document.getElementById("category-filter").value, location: document.getElementById("location-filter").value.trim(), maxPrice: document.getElementById("price-filter").value }));
      render();
    }
    if (action === "clear-filters") { sessionStorage.removeItem("farmbridge.filters"); location.href = "marketplace.html"; }
    if (action === "category-chip") {
      const filters = JSON.parse(sessionStorage.getItem("farmbridge.filters") || "{}");
      filters.category = filters.category === button.dataset.category ? "" : button.dataset.category;
      sessionStorage.setItem("farmbridge.filters", JSON.stringify(filters)); render();
    }
    if (action === "price-search") { sessionStorage.setItem("farmbridge.priceLocation", document.getElementById("price-location").value.trim()); render(); }
    if (action === "clear-price-search") { sessionStorage.removeItem("farmbridge.priceLocation"); render(); }
    if (action === "cookies-accept" || action === "cookies-reject") {
      cookie.set("farmbridge-consent", action === "cookies-accept" ? "accepted" : "rejected", 180);
      if (action === "cookies-reject") cookie.set("farmbridge-recent", "", 1);
      render();
    }
    if (action === "theme") {
      const dark = !document.body.classList.contains("theme-dark");
      document.body.classList.toggle("theme-dark", dark);
      const value = dark ? "dark" : "light";
      store.write("preferences", { ...store.read("preferences"), theme: value });
      if (cookie.get("farmbridge-consent") === "accepted") cookie.set("farmbridge-theme", value, 180);
      else sessionStorage.setItem("farmbridge-theme", value);
    }
    if (action === "toggle-password") {
      const input = document.getElementById("auth-password");
      input.type = input.type === "password" ? "text" : "password";
    }
    if (action === "toggle-admin-password") {
      const input = document.getElementById("admin-password");
      input.type = input.type === "password" ? "text" : "password";
    }
    if (action === "admin-logout") auth.adminSignOut();
    if (action === "logout") auth.signOut();
    if (action === "simulate-payment-failure") location.href = "checkout.html?payment=failed";
    if (action === "add-product") productForm(null);
    if (action === "edit-product") {
      const product = store.read("products").find(item => item.id === id);
      if (product) productForm(product);
    }
    if (action === "delete-product") {
      if (confirm("Delete this product listing?")) { store.remove("products", id); render(); toast("Product listing deleted."); }
    }
    if (action === "order-status" || action === "reject-order") {
      const orders = store.read("orders"), order = orders.find(item => item.id === id);
      if (order) {
        const nextStatus = action === "reject-order" ? "Rejected" : button.dataset.status;
        if (!transitionOrder(order, nextStatus)) return toast("There isn’t enough stock to reopen this rejected order.");
        store.write("orders", orders); render(); toast("Order updated.");
      }
    }
    if (action === "add-user") userForm(null);
    if (action === "add-farmer") userForm(null, "farmer");
    if (action === "add-customer") userForm(null, "customer");
    if (action === "edit-user") { const user = store.read("users").find(item => item.id === id); if (user) userForm(user); }
    if (action === "toggle-farmer") {
      const users = store.read("users"), user = users.find(item => item.id === id && item.role === "farmer");
      if (user && confirm(`${user.isActive === false ? "Activate" : "Deactivate"} ${user.name}? ${user.isActive === false ? "Their listings will become visible again." : "Their listings will be hidden and their current session will be denied."}`)) {
        user.isActive = user.isActive === false;
        store.write("users", users);
        render(); toast(`Farmer ${user.isActive ? "activated" : "deactivated"}.`);
      }
    }
    if (action === "delete-user") {
      const user = store.read("users").find(item => item.id === id);
      const openOrders = user?.role === "farmer" ? store.read("orders").filter(order => ["Pending", "Accepted", "Packed"].includes(order.status) && order.items.some(item => item.farmerEmail === user.email)) : [];
      if (user && confirm(`Delete ${user.name}? ${user.role === "farmer" ? "Their product listings will also be deleted. " : ""}${openOrders.length ? `${openOrders.length} open orders will be rejected and refunded. ` : ""}Historical orders remain.`)) {
        if (openOrders.length) {
          openOrders.forEach(order => transitionOrder(order, "Rejected"));
          store.write("orders", store.read("orders").map(order => openOrders.some(openOrder => openOrder.id === order.id) ? openOrders.find(openOrder => openOrder.id === order.id) : order));
        }
        if (user.role === "farmer") store.write("products", store.read("products").filter(product => product.farmerEmail !== user.email));
        store.remove("users", id); render(); toast("User deleted.");
      }
    }
    if (action === "customer-orders") {
      const customer = store.read("users").find(user => user.id === id);
      const orders = store.read("orders").filter(order => order.customerEmail === customer?.email);
      if (customer) modal(`<span class="eyebrow">Customer account</span><h2>Orders for ${escape(customer.name)}</h2>${orders.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map(order => `<tr><td>#${escape(order.id.slice(-7).toUpperCase())}</td><td>${new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td>${money(order.total)}</td><td>${escape(order.status)}</td></tr>`).join("")}</tbody></table></div>` : `<p>This customer has no orders yet.</p>`}`);
    }
    if (action === "order-details") {
      const order = store.read("orders").find(item => item.id === id);
      if (order) modal(`<span class="eyebrow">Order details</span><h2>Order ${escape(order.id.slice(-8).toUpperCase())}</h2><p><strong>Customer:</strong> ${escape(order.customerName)} · ${escape(order.customerEmail)}</p><p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleString("en-IN")}</p><p><strong>Delivery:</strong> ${escape(order.address || "—")} · ${escape(order.phone || "—")}</p><p><strong>Payment:</strong> ${escape(order.payment)} · <strong>Status:</strong> ${escape(order.status)}</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Farmer</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map(item => `<tr><td>${escape(item.name)}</td><td>${escape(item.farmer || "—")}</td><td>${Number(item.quantity)}</td><td>${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table></div><h3>Total ${money(order.total)}</h3>`);
    }
    if (action === "add-category") {
      categoryForm("");
    }
    if (action === "delete-category") {
      const category = button.dataset.category;
      const products = store.read("products");
      const affected = products.filter(product => product.category === category).length;
      if (confirm(`Remove category "${category}"? ${affected ? `${affected} product(s) will be reassigned to "Other".` : ""}`)) {
        let categories = store.read("categories").filter(item => item !== category);
        if (affected && !categories.includes("Other")) categories = [...categories, "Other"];
        store.write("categories", categories);
        if (affected) store.write("products", products.map(product => product.category === category ? { ...product, category: "Other" } : product));
        render();
      }
    }
    if (action === "edit-category") categoryForm(button.dataset.category);
    if (action === "delete-review") { if (confirm("Delete this review?")) { store.remove("reviews", id); render(); } }
    if (action === "delete-order") {
      const order = store.read("orders").find(item => item.id === id);
      if (order && confirm("Delete this order record?")) {
        if (["Pending", "Accepted", "Packed"].includes(order.status)) transitionOrder(order, "Rejected");
        store.remove("orders", id); render(); toast("Order record deleted.");
      }
    }
    if (action === "edit-profile") profileForm(auth.current());
    if (action === "review-order") {
      const order = store.read("orders").find(item => item.id === id);
      if (order) modal(`<span class="eyebrow">Your feedback</span><h2>Review your order</h2><form id="review-form" data-order="${escape(order.id)}"><div class="form-field"><label>Product</label><select name="product">${order.items.map(item => `<option value="${escape(item.productId)}">${escape(item.name)}</option>`).join("")}</select></div><div class="form-field"><label>Rating</label><select name="rating"><option value="5">5 — Excellent</option><option value="4">4 — Great</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Needs improvement</option></select></div><div class="form-field"><label>Your review</label><textarea name="comment" rows="3" required></textarea></div><button class="btn">Submit review</button></form>`);
    }
    if (action === "close-modal" && (event.target === button || button.closest(".modal") === null)) document.querySelector(".modal-backdrop")?.remove();
  });
  app.addEventListener("change", event => {
    const input = event.target;
    if (input.dataset.action === "cart-quantity") {
      const product = store.read("products").find(item => item.id === input.dataset.id);
      const quantity = Math.min(Number(product?.stock || 1), Math.max(1, Number(input.value) || 1));
      const cart = store.read("cart").map(item => item.productId === input.dataset.id ? { ...item, quantity } : item);
      store.write("cart", cart); sessionStorage.setItem("farmbridge.activeCart", JSON.stringify(cart)); render();
    }
    if (input.dataset.action === "admin-order-status") {
      if (page === "admin" && !auth.adminCurrent()) return location.replace("admin-login.html");
      const orders = store.read("orders"), order = orders.find(item => item.id === input.dataset.id);
      if (order) {
        if (!transitionOrder(order, input.value)) { input.value = order.status; return toast("There isn’t enough stock to reopen this rejected order."); }
        store.write("orders", orders); render(); toast("Order status updated.");
      }
    }
    if (input.dataset.filterTable) filterAdminTable(input.dataset.filterTable);
    if (input.id === "report-period") {
      sessionStorage.setItem("farmbridge.adminReportPeriod", input.value);
      render();
    }
  });
  app.addEventListener("input", event => {
    if (event.target.dataset.filterTable) {
      const table = document.getElementById(event.target.dataset.filterTable);
      if (!table) return;
      filterAdminTable(event.target.dataset.filterTable);
    }
    if (event.target.name === "address") sessionStorage.setItem("farmbridge.checkout", JSON.stringify({ address: event.target.value }));
  });
  app.addEventListener("submit", async event => {
    const form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    const data = new FormData(form);
    if (page === "admin" && !auth.adminCurrent()) {
      location.replace("admin-login.html");
      return;
    }
    if (form.id === "login-form") sessionStorage.removeItem("farmbridge.adminSession");
    if (form.id === "admin-login-form") {
      const valid = auth.adminSignIn(data.get("email"), data.get("password"));
      if (!valid) {
        const error = document.getElementById("admin-login-error");
        error.hidden = false;
        document.getElementById("admin-password").value = "";
        document.getElementById("admin-password").focus();
        return;
      }
      location.href = "admin.html";
      return;
    }
    if (form.id === "login-form" || form.id === "register-form") {
      const register = form.id === "register-form";
      const email = String(data.get("email")).trim().toLowerCase();
      const password = String(data.get("password") || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Enter a valid email address.");
      if (password.length < 8) return toast("Use at least 8 characters for the demo password.");
      if (register && password !== data.get("confirm")) return toast("Passwords don’t match.");
      const role = String(data.get("role"));
      let user = store.read("users").find(item => item.email.toLowerCase() === email && item.role === role);
      if (register) {
        if (store.read("users").some(item => item.email.toLowerCase() === email)) return toast("An account already uses this email. Please sign in.");
        user = { id: store.id("user"), name: String(data.get("name")).trim(), email, role, location: String(data.get("location")).trim(), joined: new Date().toISOString().slice(0, 10), isActive: true };
        store.upsert("users", user);
      } else if (!user) {
        user = { id: store.id("user"), name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, char => char.toUpperCase()), email, role, location: "", joined: new Date().toISOString().slice(0, 10), isActive: true };
        store.upsert("users", user);
      }
      if (role === "farmer" && user.isActive === false) return toast("This farmer account is inactive. Contact FarmBridge support.");
      auth.signIn(user);
      location.href = auth.dashboard(role);
      return;
    }
    if (form.id === "product-form") {
      const current = auth.current();
      const old = form.dataset.id ? store.read("products").find(item => item.id === form.dataset.id) : null;
      const file = data.get("imageFile");
      let image = String(data.get("imageUrl") || "").trim();
      if (file && file.size) {
        if (!file.type.startsWith("image/")) return toast("Choose a valid image file.");
        if (file.size > 1024 * 1024) return toast("Please choose an image under 1 MB.");
        image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read the selected image."));
          reader.readAsDataURL(file);
        }).catch(error => { console.error(error); toast("Could not read that image."); return ""; });
        if (!image) return;
      }
      const product = {
        ...(old || {}), id: old?.id || store.id("product"), name: String(data.get("name")).trim(),
        category: String(data.get("category")), description: String(data.get("description")).trim(),
        price: Number(data.get("price")), stock: Number(data.get("stock")), unit: String(data.get("unit")),
        location: String(data.get("location")).trim(), harvestDate: String(data.get("harvestDate")),
        organic: data.has("organic"), image: image || old?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
        farmer: current?.role === "farmer" ? current.name : (data.get("farmer") ? String(data.get("farmer")).trim() : String(old?.farmer || current?.name || "FarmBridge farmer")),
        farmerEmail: current?.role === "farmer" ? current.email : (data.get("farmerEmail") ? String(data.get("farmerEmail")).trim().toLowerCase() : String(old?.farmerEmail || current?.email || ""))
      };
      if (page === "admin" && product.farmerEmail) {
        const owner = store.read("users").find(item => item.email === product.farmerEmail && item.role === "farmer");
        if (!owner) return toast("Choose an existing farmer email or leave it blank for an unassigned demo listing.");
        product.farmer = owner.name;
        if (!old && owner.isActive === false) return toast("Activate this farmer before assigning them a new listing.");
      }
      if (product.price <= 0 || product.stock < 0) return toast("Enter a valid price and stock quantity.");
      store.upsert("products", product);
      document.querySelector(".modal-backdrop")?.remove(); render(); toast("Product saved to the marketplace.");
    }
    if (form.id === "user-form") {
      const id = form.dataset.id || store.id("user");
      const previous = store.read("users").find(item => item.id === id);
      const email = String(data.get("email")).trim().toLowerCase();
      if (store.read("users").some(item => item.email.toLowerCase() === email && item.id !== id)) return toast("That email already belongs to another account.");
      const role = String(data.get("role"));
      const updated = { ...(previous || {}), id, name: String(data.get("name")).trim(), email, role, location: String(data.get("location")).trim(), joined: previous?.joined || new Date().toISOString().slice(0, 10), isActive: role === "farmer" ? data.has("isActive") : true };
      store.upsert("users", updated);
      if (previous?.role === "farmer" && role === "farmer") {
        const products = store.read("products").map(product => product.farmerEmail === previous.email ? { ...product, farmer: updated.name, farmerEmail: updated.email, location: updated.location || product.location } : product);
        store.write("products", products);
        const orders = store.read("orders").map(order => ({ ...order, items: order.items.map(item => item.farmerEmail === previous.email ? { ...item, farmer: updated.name, farmerEmail: updated.email } : item) }));
        store.write("orders", orders);
      }
      if (previous?.role === "customer" && role === "customer" && previous.email !== updated.email) {
        const orders = store.read("orders").map(order => order.customerEmail === previous.email ? { ...order, customerEmail: updated.email, customerName: updated.name } : order);
        store.write("orders", orders);
      }
      document.querySelector(".modal-backdrop")?.remove(); render(); toast("User details saved.");
    }
    if (form.id === "category-form") {
      const original = form.dataset.original;
      const name = String(data.get("name")).trim();
      const categories = store.read("categories");
      if (!name) return toast("Enter a category name.");
      if (categories.some(item => item.toLowerCase() === name.toLowerCase() && item !== original)) return toast("That category already exists.");
      if (original) {
        store.write("categories", categories.map(item => item === original ? name : item));
        store.write("products", store.read("products").map(product => product.category === original ? { ...product, category: name } : product));
      } else store.write("categories", [...categories, name]);
      document.querySelector(".modal-backdrop")?.remove(); render(); toast("Category saved.");
    }
    if (form.id === "profile-form") {
      const current = auth.current(), email = String(data.get("email")).trim().toLowerCase();
      if (store.read("users").some(item => item.email.toLowerCase() === email && item.id !== current.id)) return toast("That email is already in use.");
      const updated = { ...current, name: String(data.get("name")).trim(), email, location: String(data.get("location")).trim() };
      store.upsert("users", { ...store.read("users").find(item => item.id === current.id), ...updated });
      auth.signIn(updated); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Profile updated.");
    }
    if (form.id === "checkout-form") {
      const cart = store.read("cart");
      const products = store.read("products");
      for (const item of cart) {
        const product = products.find(row => row.id === item.productId);
        if (!product || product.stock < item.quantity) return toast("A product’s available stock changed. Please review your cart.");
      }
      const user = auth.current();
      const items = cart.map(item => {
        const product = products.find(row => row.id === item.productId);
        return { productId: product.id, name: product.name, quantity: item.quantity, price: product.price, farmer: product.farmer, farmerEmail: product.farmerEmail };
      });
      const order = { id: store.id("order"), customerEmail: user.email, customerName: String(data.get("name")).trim(), phone: String(data.get("phone")).trim(), address: String(data.get("address")).trim(), items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), payment: String(data.get("payment")), status: "Pending", createdAt: new Date().toISOString(), demo: true };
      store.upsert("orders", order);
      for (const item of cart) {
        const product = products.find(row => row.id === item.productId);
        product.stock -= item.quantity;
        store.upsert("products", product);
      }
      store.write("cart", []); sessionStorage.removeItem("farmbridge.activeCart"); sessionStorage.removeItem("farmbridge.checkout");
      location.href = "checkout.html?order=" + encodeURIComponent(order.id);
    }
    if (form.id === "review-form") {
      const user = auth.current(), product = store.read("products").find(item => item.id === data.get("product"));
      store.upsert("reviews", { id: store.id("review"), productId: String(data.get("product")), productName: product?.name || "Product", customerName: user.name, rating: Number(data.get("rating")), comment: String(data.get("comment")).trim(), createdAt: new Date().toISOString() });
      document.querySelector(".modal-backdrop")?.remove(); render(); toast("Thank you for sharing your review.");
    }
    if (form.id === "contact-form") {
      const messages = JSON.parse(localStorage.getItem("farmbridge.messages") || "[]");
      messages.unshift({ id: store.id("message"), name: data.get("name"), email: data.get("email"), topic: data.get("topic"), message: data.get("message"), createdAt: new Date().toISOString() });
      localStorage.setItem("farmbridge.messages", JSON.stringify(messages));
      form.reset(); toast("Thanks — your message is saved in this demo browser.");
    }
  });
  app.addEventListener("error", event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = "true";
    image.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#e8f1df"/><circle cx="450" cy="320" r="115" fill="#c8df93"/><path d="M450 400c-35-100 18-174 142-197-3 116-55 181-142 197Zm0 0c22-81-18-132-106-150 1 89 39 139 106 150Z" fill="#1f603f"/><text x="450" y="520" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#16452e">Fresh from the farm</text></svg>');
  }, true);
  render();
})();
