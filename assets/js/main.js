// === Header / Nav / Footer year ===
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => drawer.classList.toggle('open'));
    document.querySelectorAll('.mobile-drawer a').forEach(a =>
      a.addEventListener('click', () => drawer.classList.remove('open'))
    );
  }
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// === Utilities ===
const KRW = (n) => '₩' + Number(n).toLocaleString('ko-KR');

let _cache = null;
async function loadProducts() {
  if (_cache) return _cache;
  const res = await fetch('data/products.json');
  if (!res.ok) throw new Error('products.json 로드 실패');
  const json = await res.json();
  _cache = json.products;
  return _cache;
}

function productCardHTML(p) {
  const tags = (p.tags || []).map(t =>
    `<span class="product-tag${t === 'NEW' ? ' new' : ''}">${t}</span>`
  ).join('');
  return `
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="product-image">
        ${tags ? `<div class="product-tags">${tags}</div>` : ''}
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
        ${p.images[1] ? `<img class="img-back" src="${p.images[1]}" alt="" loading="lazy">` : ''}
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <span class="product-name">${p.name}</span>
        <span class="product-price">${KRW(p.price)}</span>
      </div>
    </a>
  `;
}

// === Home: Featured grid ===
(async () => {
  const featured = document.querySelector('[data-featured]');
  if (!featured) return;
  try {
    const products = await loadProducts();
    const limit = parseInt(featured.dataset.featured, 10) || 8;
    featured.innerHTML = products.slice(0, limit).map(productCardHTML).join('');
  } catch (e) {
    featured.innerHTML = `<div class="product-grid-empty">상품을 불러오지 못했습니다.</div>`;
    console.error(e);
  }
})();

// === Shop: Grid + Filter ===
(async () => {
  const grid = document.querySelector('[data-shop-grid]');
  if (!grid) return;
  try {
    const products = await loadProducts();
    const params = new URLSearchParams(location.search);
    let active = (params.get('cat') || 'ALL').toUpperCase();

    const render = () => {
      const filtered = active === 'ALL'
        ? products
        : products.filter(p => p.category === active);
      grid.innerHTML = filtered.length
        ? filtered.map(productCardHTML).join('')
        : `<div class="product-grid-empty">해당 카테고리의 상품이 아직 없습니다.</div>`;
    };

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === active);
      btn.addEventListener('click', () => {
        active = btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        const url = new URL(location.href);
        if (active === 'ALL') url.searchParams.delete('cat');
        else url.searchParams.set('cat', active);
        history.replaceState(null, '', url);
        render();
      });
    });
    render();
  } catch (e) {
    grid.innerHTML = `<div class="product-grid-empty">상품을 불러오지 못했습니다.</div>`;
    console.error(e);
  }
})();

// === Product Detail ===
(async () => {
  const root = document.querySelector('[data-product-detail]');
  if (!root) return;
  try {
    const id = new URLSearchParams(location.search).get('id');
    const products = await loadProducts();
    const p = products.find(x => x.id === id);
    if (!p) {
      root.innerHTML = `<div style="padding:80px 24px;text-align:center;grid-column:1/-1">
        <p style="margin-bottom:16px;color:var(--c-muted)">상품을 찾을 수 없습니다.</p>
        <a class="btn-secondary" href="shop.html">SHOP으로 돌아가기</a>
      </div>`;
      return;
    }

    document.title = `${p.name} — ILLPRO`;

    const colors = p.colors.map((c, i) =>
      `<button class="opt-btn${i === 0 ? ' active' : ''}" data-opt="color">${c}</button>`
    ).join('');
    const sizes = p.sizes.map((s, i) =>
      `<button class="opt-btn${i === 0 ? ' active' : ''}" data-opt="size">${s}</button>`
    ).join('');

    root.innerHTML = `
      <div class="detail-images">
        ${p.images.map(src => `<img src="${src}" alt="${p.name}" loading="lazy">`).join('')}
      </div>
      <div class="detail-info">
        <div class="detail-cat">${p.category}</div>
        <h1>${p.name}</h1>
        <div class="detail-name-kr">${p.nameKr}</div>
        <div class="detail-price">${KRW(p.price)}</div>

        <div class="detail-options">
          <span class="detail-option-label">Color</span>
          <div class="detail-options-row" data-opt-row="color">${colors}</div>
          <span class="detail-option-label">Size</span>
          <div class="detail-options-row" data-opt-row="size">${sizes}</div>
        </div>

        <div class="detail-actions">
          <button class="btn-primary" data-add-bag>ADD TO BAG</button>
          <a class="btn-secondary" href="https://instagram.com/illpro.shop" target="_blank" rel="noopener">문의</a>
        </div>

        <div class="detail-desc">${p.description}</div>
      </div>
    `;

    root.querySelectorAll('.detail-options-row').forEach(row => {
      row.addEventListener('click', e => {
        const btn = e.target.closest('.opt-btn');
        if (!btn) return;
        row.querySelectorAll('.opt-btn').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
      });
    });

    const addBtn = root.querySelector('[data-add-bag]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        alert('결제 시스템 연동 예정입니다.\n구매 문의는 인스타그램 DM으로 연락주세요.');
      });
    }
  } catch (e) {
    root.innerHTML = `<div style="padding:80px 24px;text-align:center;grid-column:1/-1">
      <p style="color:var(--c-muted)">상품을 불러오지 못했습니다.</p>
    </div>`;
    console.error(e);
  }
})();
