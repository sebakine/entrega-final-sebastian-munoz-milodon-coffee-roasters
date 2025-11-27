document.addEventListener("DOMContentLoaded", function () {
  console.log("🛒 Inicializando lógica del carrito...");

  // Inicializar Tooltips de Bootstrap
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-tooltip="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // ==========================================
  // LÓGICA DEL CARRITO DE COMPRAS
  // ==========================================

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItemCount = document.getElementById("cart-item-count");
  const cartBadge = document.getElementById("cart-badge");
  const cartItems = document.getElementById("cart-items");
  const cartFooter = document.getElementById("cart-footer");
  const cartTotal = document.getElementById("cart-total");

  // Inicializar Toast si existe el elemento
  const toastEl = document.getElementById("cartToast");
  const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

  // Actualizar contador del carrito
  function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Actualizar número en el texto (ej: "Carro (0)")
    if (cartItemCount) {
      // Si el elemento tiene paréntesis, mantenemos el formato, si no, solo el número
      if (cartItemCount.textContent.includes("(")) {
        cartItemCount.textContent = `(${count})`;
      } else {
        cartItemCount.textContent = count;
      }
    }

    // Actualizar badge rojo si existe
    if (cartBadge) {
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? "block" : "none";
    }
  }

  // Renderizar items del carrito
  function renderCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `
                <div class="text-center py-5">
                    <i class="fa-solid fa-basket-shopping fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Tu carrito está vacío</p>
                    <button class="btn btn-primary" data-bs-dismiss="offcanvas">Seguir Comprando</button>
                </div>
            `;
      if (cartFooter) cartFooter.style.display = "none";
    } else {
      let total = 0;
      cartItems.innerHTML = cart
        .map((item, index) => {
          const itemTotal = item.price * item.quantity;
          total += itemTotal;
          return `
                    <div class="d-flex mb-3 pb-3 border-bottom">
                        <img src="${item.image}" alt="${
            item.name
          }" class="rounded" style="width: 80px; height: 80px; object-fit: cover;">
                        <div class="flex-grow-1 ms-3">
                            <h6 class="mb-1">${item.name}</h6>
                            <p class="text-muted mb-1">$${item.price.toLocaleString(
                              "es-CL"
                            )} x ${item.quantity}</p>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateQuantity(${index}, -1)">-</button>
                                <span class="me-2">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateQuantity(${index}, 1)">+</button>
                                <button class="btn btn-sm btn-danger ms-auto" onclick="removeFromCart(${index})" aria-label="Eliminar ${
            item.name
          }">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        })
        .join("");

      if (cartTotal)
        cartTotal.textContent = `$${total.toLocaleString("es-CL")}`;
      if (cartFooter) cartFooter.style.display = "block";
    }
  }

  // Añadir al carrito (desde botones normales)
  document.querySelectorAll(".btn-add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const product = this.getAttribute("data-product");
      const price = parseInt(this.getAttribute("data-price")) || 0;

      // Intentar obtener la imagen del producto
      // Buscamos la imagen en la tarjeta contenedora
      let image = "";
      const card = this.closest(".card-product");
      if (card) {
        const imgEl = card.querySelector(".container-img img");
        if (imgEl) image = imgEl.src;
      }

      // Si no encontramos imagen, usamos una por defecto o placeholder
      if (!image) image = "https://via.placeholder.com/80";

      addToCart(product, price, image, 1);
    });
  });

  // Función centralizada para añadir al carrito
  function addToCart(product, price, image, quantity) {
    const existingItem = cart.find((item) => item.name === product);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        name: product,
        price: price,
        image: image,
        quantity: quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();

    // Mostrar Toast
    if (toast && document.getElementById("toast-message")) {
      document.getElementById(
        "toast-message"
      ).textContent = `${product} añadido al carrito`;
      toast.show();
    }

    // Abrir el offcanvas automáticamente (opcional, comentado por ahora para no ser intrusivo)
    // const bsOffcanvas = new bootstrap.Offcanvas('#cartOffcanvas');
    // bsOffcanvas.show();
  }

  // ==========================================
  // MODAL VISTA RÁPIDA
  // ==========================================

  const quickViewModal = document.getElementById("quickViewModal");
  if (quickViewModal) {
    quickViewModal.addEventListener("show.bs.modal", function (event) {
      const button = event.relatedTarget;
      const product = button.getAttribute("data-product");
      const price = button.getAttribute("data-price");
      const image = button.getAttribute("data-image");

      const titleEl = document.getElementById("quick-view-title");
      const priceEl = document.getElementById("quick-view-price");
      const imageEl = document.getElementById("quick-view-image");

      if (titleEl) titleEl.textContent = product;
      if (priceEl)
        priceEl.textContent = `$${parseInt(price).toLocaleString("es-CL")}`;
      if (imageEl) {
        imageEl.src = image;
        imageEl.alt = product;
      }

      const qtyInput = document.getElementById("product-qty");
      if (qtyInput) qtyInput.value = 1;
    });
  }

  // Botón "Añadir al Carrito" dentro del Modal
  document
    .getElementById("quick-view-add-cart")
    ?.addEventListener("click", function () {
      const product =
        document.getElementById("quick-view-title")?.textContent || "";
      const priceText =
        document.getElementById("quick-view-price")?.textContent || "0";
      const image = document.getElementById("quick-view-image")?.src || "";
      const qty = parseInt(document.getElementById("product-qty")?.value) || 1;

      const price = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      addToCart(product, price, image, qty);

      // Cerrar modal
      const modalEl = document.getElementById("quickViewModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    });

  // Controles de cantidad en modal
  document
    .getElementById("increase-qty")
    ?.addEventListener("click", function () {
      const qtyInput = document.getElementById("product-qty");
      if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
    });

  document
    .getElementById("decrease-qty")
    ?.addEventListener("click", function () {
      const qtyInput = document.getElementById("product-qty");
      if (qtyInput && parseInt(qtyInput.value) > 1)
        qtyInput.value = parseInt(qtyInput.value) - 1;
    });

  // ==========================================
  // FUNCIONES GLOBALES (window)
  // ==========================================

  // Necesarias porque se llaman desde el HTML generado dinámicamente (onclick)

  window.updateQuantity = function (index, change) {
    if (!cart[index]) return;

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
  };

  window.removeFromCart = function (index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
  };

  // Renderizar carrito cuando se abre el offcanvas
  const cartOffcanvas = document.getElementById("cartOffcanvas");
  if (cartOffcanvas) {
    cartOffcanvas.addEventListener("show.bs.offcanvas", function () {
      renderCart();
    });
  }

  // Inicializar al cargar
  updateCartCount();
  // Si el offcanvas está abierto por defecto (no debería), renderizar
  if (cartOffcanvas && cartOffcanvas.classList.contains("show")) {
    renderCart();
  }
});
