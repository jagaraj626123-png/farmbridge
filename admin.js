(function () {
  const escape = () => window.FarmBridge.escape;
  const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const farmerActive = farmer => farmer.isActive !== false;
  function render() {
    const store = window.FarmBridgeStore;
    const users = store.read("users");
    const farmers = users.filter(user => user.role === "farmer");
    const customers = users.filter(user => user.role === "customer");
    const products = store.read("products");
    const orders = store.read("orders");
    const reviews = store.read("reviews");
    const revenueOrders = orders.filter(order => order.status !== "Rejected");
    const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pending = orders.filter(order => order.status === "Pending").length;
    const categories = store.read("categories");
    const farmerRows = farmers.map(user => `<tr data-search="${escape()(user.name + " " + user.email + " " + (user.location || ""))}"><td>${escape()(user.name)}</td><td>${escape()(user.email)}</td><td>${escape()(user.location || "—")}</td><td><span class="status ${farmerActive(user) ? "" : "rejected"}">${farmerActive(user) ? "Active" : "Inactive"}</span></td><td><button class="btn btn-outline btn-small" data-action="edit-user" data-id="${escape()(user.id)}">Edit</button> <button class="btn btn-outline btn-small" data-action="toggle-farmer" data-id="${escape()(user.id)}">${farmerActive(user) ? "Deactivate" : "Activate"}</button> <button class="btn btn-danger btn-small" data-action="delete-user" data-id="${escape()(user.id)}">Delete</button></td></tr>`).join("");
    const customerRows = customers.map(user => `<tr data-search="${escape()(user.name + " " + user.email + " " + (user.location || ""))}"><td>${escape()(user.name)}</td><td>${escape()(user.email)}</td><td>${escape()(user.location || "—")}</td><td><button class="btn btn-outline btn-small" data-action="edit-user" data-id="${escape()(user.id)}">Edit</button> <button class="btn btn-outline btn-small" data-action="customer-orders" data-id="${escape()(user.id)}">Orders</button> <button class="btn btn-danger btn-small" data-action="delete-user" data-id="${escape()(user.id)}">Delete</button></td></tr>`).join("");
    const productRows = products.map(product => `<tr data-search="${escape()(product.name + " " + product.farmer + " " + product.category + " " + product.location)}"><td>${escape()(product.name)}</td><td>${escape()(product.farmer)}</td><td>${escape()(product.category)}</td><td>${money(product.price)}</td><td>${Number(product.stock)} ${escape()(product.unit || "kg")}</td><td><button class="btn btn-outline btn-small" data-action="edit-product" data-id="${escape()(product.id)}">Edit</button> <button class="btn btn-danger btn-small" data-action="delete-product" data-id="${escape()(product.id)}">Delete</button></td></tr>`).join("");
    const orderRows = orders.map(order => `<tr data-search="${escape()(order.id + " " + order.customerName + " " + order.status)}"><td>#${escape()(order.id.slice(-7).toUpperCase())}</td><td>${escape()(order.customerName)}</td><td>${new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td>${money(order.total)}</td><td><select class="field" data-action="admin-order-status" data-id="${escape()(order.id)}">${["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Rejected"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select> <button class="btn btn-outline btn-small" data-action="order-details" data-id="${escape()(order.id)}">Details</button> <button class="btn btn-danger btn-small" data-action="delete-order" data-id="${escape()(order.id)}">Delete</button></td></tr>`).join("");
    const categoryRows = categories.map(category => `<div class="category-admin-row"><span class="pill">${escape()(category)}</span><button class="btn btn-outline btn-small" data-action="edit-category" data-category="${escape()(category)}">Edit</button><button class="btn btn-danger btn-small" data-action="delete-category" data-category="${escape()(category)}">Delete</button></div>`).join("");
    const reviewRows = reviews.map(review => `<tr><td>${escape()(review.productName)}</td><td>${escape()(review.customerName)}</td><td>${"★".repeat(review.rating)}</td><td>${escape()(review.comment)}</td><td><button class="btn btn-danger btn-small" data-action="delete-review" data-id="${escape()(review.id)}">Delete</button></td></tr>`).join("");
    const period = sessionStorage.getItem("farmbridge.adminReportPeriod") || "daily";
    return `<div class="dashboard-layout"><aside class="sidebar"><a class="brand" href="index.html"><span class="brand-mark">♧</span><span>FarmBridge<small>ADMIN CONSOLE</small></span></a><nav class="sidebar-nav"><a class="active" href="#admin-overview">Overview</a><a href="#admin-farmers">Farmers</a><a href="#admin-customers">Customers</a><a href="#admin-products">Products</a><a href="#admin-orders">Orders</a><a href="#admin-categories">Categories</a><a href="#admin-reports">Reports</a><a href="#admin-reviews">Reviews</a></nav></aside><main class="dash-main" id="admin-overview"><div class="dash-head"><div><span class="eyebrow">Platform administration</span><h1>Operations overview</h1><p>Manage the FarmBridge demo ecosystem.</p></div><div><span class="admin-email">admin@farmbridge.com</span> <button class="btn btn-outline" data-action="admin-logout">Sign out</button></div></div><div class="notice">Demo admin access is frontend-only. This dashboard is not protected against browser inspection or tampering; add server-side authentication and authorization before production.</div><div class="metric-grid admin-metrics"><div class="metric"><span>Total farmers</span><strong>${farmers.length}</strong></div><div class="metric"><span>Total customers</span><strong>${customers.length}</strong></div><div class="metric"><span>Total products</span><strong>${products.length}</strong></div><div class="metric"><span>Total orders</span><strong>${orders.length}</strong></div><div class="metric"><span>Total revenue</span><strong>${money(revenue)}</strong></div><div class="metric"><span>Pending orders</span><strong>${pending}</strong></div></div><section class="panel" id="admin-farmers"><div class="panel-head"><h3>Farmer management</h3><button class="btn btn-small" data-action="add-farmer">Add farmer</button></div><input class="field admin-search" data-filter-table="farmers-table" placeholder="Search farmer name, email or location"><div class="table-wrap"><table class="data-table"><thead><tr><th>Farmer</th><th>Email</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody id="farmers-table">${farmerRows || `<tr><td colspan="5" class="empty-state">No farmers yet.</td></tr>`}</tbody></table></div></section><section class="panel" id="admin-customers"><div class="panel-head"><h3>Customer management</h3><button class="btn btn-small" data-action="add-customer">Add customer</button></div><input class="field admin-search" data-filter-table="customers-table" placeholder="Search customer name, email or location"><div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Email</th><th>Location</th><th>Actions</th></tr></thead><tbody id="customers-table">${customerRows || `<tr><td colspan="4" class="empty-state">No customers yet.</td></tr>`}</tbody></table></div></section><section class="panel" id="admin-products"><div class="panel-head"><h3>Product management</h3><button class="btn btn-small" data-action="add-product">Add product</button></div><input class="field admin-search" data-filter-table="products-table" placeholder="Search products, farmer or category"><div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Farmer</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody id="products-table">${productRows || `<tr><td colspan="6" class="empty-state">No products listed yet.</td></tr>`}</tbody></table></div></section><section class="panel" id="admin-orders"><div class="panel-head"><h3>Order management</h3><span>${pending} pending</span></div><input class="field admin-search" data-filter-table="orders-table" placeholder="Search order, customer or status"><div class="table-wrap"><table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status / actions</th></tr></thead><tbody id="orders-table">${orderRows || `<tr><td colspan="5" class="empty-state">No orders yet.</td></tr>`}</tbody></table></div></section><section class="panel" id="admin-categories"><div class="panel-head"><h3>Category management</h3><button class="btn btn-outline btn-small" data-action="add-category">Add category</button></div><div class="category-admin-list">${categoryRows}</div></section><section class="panel" id="admin-reports"><div class="panel-head"><div><span class="eyebrow">Sales analytics</span><h3>Reports & performance</h3></div><select class="field" id="report-period" aria-label="Sales report period"><option value="daily" ${period === "daily" ? "selected" : ""}>Last 7 days</option><option value="monthly" ${period === "monthly" ? "selected" : ""}>Last 6 months</option></select></div><p>Total sales <strong>${money(revenue)}</strong> · Daily sales <strong>${money(salesForDay(orders, new Date()))}</strong> · Monthly sales <strong>${money(salesForMonth(orders, new Date()))}</strong></p><div class="chart-grid"><div><h4>Revenue trend</h4><canvas id="revenue-chart" height="230" aria-label="Revenue trend chart"></canvas></div><div><h4>Best-selling products</h4><canvas id="product-chart" height="230" aria-label="Best-selling products chart"></canvas></div></div><div class="analytics-grid"><div><h4>Product statistics</h4><p>${products.length} active listings across ${new Set(products.map(product => product.category)).size} categories.</p></div><div><h4>Farmer statistics</h4><p>${farmers.filter(farmerActive).length} active / ${farmers.filter(user => !farmerActive(user)).length} inactive farmers.</p></div><div><h4>Customer statistics</h4><p>${customers.length} registered customers.</p></div><div><h4>Order statistics</h4><p>${orders.filter(order => order.status === "Delivered").length} delivered · ${pending} pending · ${orders.filter(order => order.status === "Rejected").length} rejected.</p></div></div></section><section class="panel" id="admin-reviews"><div class="panel-head"><h3>Review management</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Action</th></tr></thead><tbody>${reviewRows || `<tr><td colspan="5" class="empty-state">No customer reviews yet.</td></tr>`}</tbody></table></div></section></main></div>`;
  }
  function salesForDay(orders, date) {
    const key = date.toISOString().slice(0, 10);
    return orders.filter(order => order.status !== "Rejected" && order.createdAt.slice(0, 10) === key).reduce((sum, order) => sum + Number(order.total || 0), 0);
  }
  function salesForMonth(orders, date) {
    const key = date.toISOString().slice(0, 7);
    return orders.filter(order => order.status !== "Rejected" && order.createdAt.slice(0, 7) === key).reduce((sum, order) => sum + Number(order.total || 0), 0);
  }
  function drawChart(canvas, labels, values, color) {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(260, canvas.parentElement.clientWidth - 8);
    const height = 220;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = "100%";
    canvas.style.height = height + "px";
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    const style = getComputedStyle(document.body);
    const muted = style.getPropertyValue("--muted").trim() || "#758078";
    const line = style.getPropertyValue("--line").trim() || "#e6e9e2";
    const ink = style.getPropertyValue("--ink").trim() || "#1d2b23";
    const padding = { left: 44, right: 12, top: 16, bottom: 35 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const max = Math.max(1, ...values) * 1.15;
    context.font = "11px DM Sans, sans-serif";
    context.textBaseline = "middle";
    for (let index = 0; index <= 3; index += 1) {
      const y = padding.top + plotHeight * index / 3;
      context.strokeStyle = line; context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke();
      context.fillStyle = muted; context.textAlign = "right";
      context.fillText(Math.round(max * (1 - index / 3)).toLocaleString("en-IN"), padding.left - 7, y);
    }
    const slot = plotWidth / Math.max(1, values.length);
    const barWidth = Math.min(34, slot * .58);
    values.forEach((value, index) => {
      const barHeight = plotHeight * value / max;
      const x = padding.left + slot * index + (slot - barWidth) / 2;
      const y = padding.top + plotHeight - barHeight;
      context.fillStyle = color; context.beginPath(); context.roundRect(x, y, barWidth, Math.max(2, barHeight), 4); context.fill();
      context.fillStyle = ink; context.textAlign = "center"; context.textBaseline = "top";
      context.fillText(labels[index], x + barWidth / 2, height - padding.bottom + 9);
    });
  }
  function charts() {
    const store = window.FarmBridgeStore;
    const orders = store.read("orders").filter(order => order.status !== "Rejected");
    const period = sessionStorage.getItem("farmbridge.adminReportPeriod") || "daily";
    const now = new Date();
    const labels = [], values = [];
    for (let offset = period === "daily" ? 6 : 5; offset >= 0; offset -= 1) {
      const date = new Date(now);
      if (period === "daily") date.setDate(now.getDate() - offset);
      else date.setMonth(now.getMonth() - offset, 1);
      const key = period === "daily" ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 7);
      labels.push(period === "daily" ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : date.toLocaleDateString("en-IN", { month: "short" }));
      values.push(orders.filter(order => order.createdAt.slice(0, key.length) === key).reduce((sum, order) => sum + Number(order.total || 0), 0));
    }
    drawChart(document.getElementById("revenue-chart"), labels, values, "#3d8256");
    const counts = new Map();
    orders.forEach(order => order.items.forEach(item => counts.set(item.name, (counts.get(item.name) || 0) + Number(item.quantity || 0))));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    drawChart(document.getElementById("product-chart"), top.map(([name]) => name.slice(0, 9)), top.map(([, quantity]) => quantity), "#d69a54");
  }
  function filters() {
    const store = window.FarmBridgeStore;
    const options = [
      ["farmers-table", "active", "All farmer statuses", [["true", "Active only"], ["false", "Inactive only"]]],
      ["products-table", "category", "All product categories", store.read("categories").map(category => [category, category])],
      ["orders-table", "status", "All order statuses", ["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Rejected"].map(status => [status, status])]
    ];
    options.forEach(([tableId, property, label, values]) => {
      const search = document.querySelector(`[data-filter-table="${tableId}"].admin-search`);
      if (!search || document.querySelector(`[data-filter-table="${tableId}"][data-filter-property="${property}"]`)) return;
      const select = document.createElement("select");
      select.className = "field admin-filter";
      select.dataset.filterTable = tableId;
      select.dataset.filterProperty = property;
      select.setAttribute("aria-label", label);
      select.add(new Option(label, ""));
      values.forEach(([value, name]) => select.add(new Option(name, value)));
      search.insertAdjacentElement("afterend", select);
    });
  }
  window.FarmBridgeAdmin = { render, charts, filters };
})();
