/* Only the supplied slides and category state are implemented. */
(() => {
  const hero = document.querySelector(".hero-slider");
  if (hero) {
    const track = hero.querySelector(".swiper-wrapper");
    const slides = [...track.children];
    let index = 0;
    hero.querySelector(".total").textContent = slides.length;
    const move = (step) => {
      index = (index + step + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      hero.querySelector(".current").textContent = index + 1;
      slides.forEach((slide, position) => { slide.inert = position !== index; });
    };
    hero.querySelector(".swiper-button-prev").addEventListener("click", () => move(-1));
    hero.querySelector(".swiper-button-next").addEventListener("click", () => move(1));
    move(0);
  }

  document.querySelectorAll(".new-arrival .tab-menu, .best-item .tab-menu").forEach((menu) => {
    const list = menu.closest("section").querySelector(".item-list");
    menu.addEventListener("click", (event) => {
      const tab = event.target.closest(".tab");
      if (!tab) return;
      menu.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button === tab));
      // Figma supplies outerwear only. Keep its layout space for missing category data.
      list.style.visibility = tab.textContent.trim() === "아우터" ? "visible" : "hidden";
    });
  });

  // Search has no supplied destination or service.
  document.querySelector("#search")?.addEventListener("submit", (event) => event.preventDefault());
})();

/* Product detail. No cart, account or AI service is simulated. */
(() => {
  const page = document.querySelector(".product-detail");
  if (!page) return;
  const dialog = page.querySelector(".fitting-modal");
  let closingTimer;
  let opener;
  let savedPadding = "";
  const openFitting = (event) => {
    clearTimeout(closingTimer);
    if (dialog.open) {
      dialog.classList.add("active");
      return;
    }
    opener = event.currentTarget;
    savedPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar) document.body.style.paddingRight = scrollbar + "px";
    document.body.classList.add("modal-open");
    dialog.showModal();
    dialog.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (dialog.open) dialog.classList.add("active");
    }));
  };
  const closeFitting = () => {
    if (!dialog.open) return;
    dialog.classList.remove("active");
    clearTimeout(closingTimer);
    closingTimer = setTimeout(() => dialog.close(), 300);
  };
  page.querySelectorAll(".try-on, .try-on-thumbnail").forEach(button => button.addEventListener("click", openFitting));
  dialog.querySelector(".close").addEventListener("click", closeFitting);
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeFitting();
  });
  let backdropPressed = false;
  const isBackdrop = event => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  dialog.addEventListener("pointerdown", event => { backdropPressed = isBackdrop(event); });
  dialog.addEventListener("click", event => {
    if (backdropPressed && isBackdrop(event)) closeFitting();
    backdropPressed = false;
  });
  dialog.addEventListener("close", () => {
    clearTimeout(closingTimer);
    dialog.classList.remove("active");
    document.body.classList.remove("modal-open");
    document.body.style.paddingRight = savedPadding;
    opener?.focus({preventScroll: true});
  });
  page.querySelectorAll(".th-tiny[data-image]").forEach(button => {
    button.addEventListener("click", () => {
      page.querySelector(".product-image").src = button.dataset.image;
      page.querySelectorAll(".th-tiny[data-image]").forEach(item => item.classList.toggle("active", item === button));
    });
  });
  page.querySelectorAll(".color").forEach(button => button.addEventListener("click", () => {
    page.querySelectorAll(".color").forEach(item => item.classList.toggle("active", item === button));
  }));
  page.querySelectorAll("button.fitting-info").forEach(button => button.addEventListener("click", () => {
    const tooltip = page.querySelector(".tooltip");
    tooltip.hidden = !tooltip.hidden;
  }));
  page.querySelectorAll(".outfit-toggle").forEach(button => button.addEventListener("click", () => {
    const container = button.closest(".product-outfit, .outfit-selector");
    const list = container.querySelector(".outfit-list");
    list.hidden = !list.hidden;
    button.classList.toggle("active", !list.hidden);
  }));
  dialog.querySelector(".profile-toggle").addEventListener("click", () => {
    const details = dialog.querySelector(".profile-details");
    details.hidden = !details.hidden;
  });
})();
