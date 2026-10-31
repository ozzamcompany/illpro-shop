(() => {
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (toggle && drawer) {
    const setOpen = (open) => {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !drawer.hidden) { setOpen(false); toggle.focus(); }
    });
  }
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const currentPage = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-main a, .mobile-drawer a').forEach(a => {
    if (a.getAttribute('href') === currentPage || (currentPage === 'product.html' && a.getAttribute('href') === 'shop.html')) a.setAttribute('aria-current', 'page');
  });
})();

const KRW = n => '₩' + Number(n).toLocaleString('ko-KR');
const hasPrice = p => typeof p.price === 'number' && Number.isFinite(p.price) && p.price >= 0;
const priceLabel = p => hasPrice(p) ? KRW(p.price) : '상품 문의';
const categoryLabel = p => [p.audience, p.category].filter(Boolean).join(' / ');
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let _cache = null;
async function loadProducts() {
  if (_cache) return _cache;
  const res = await fetch('data/products.json?v=20261031-premium1');
  if (!res.ok) throw new Error('products.json 로드 실패');
  const json = await res.json();
  const editOrder = ['ip-009', 'ip-010', 'ip-011', 'ip-012', 'ip-013', 'ip-014', 'ip-015', 'ip-016', 'ip-017', 'ip-018', 'ip-003', 'ip-007', 'ip-006', 'ip-005', 'ip-001', 'ip-002', 'ip-004', 'ip-008'];
  _cache = json.products.slice().sort((a,b) => {
    const ai = editOrder.indexOf(a.id), bi = editOrder.indexOf(b.id);
    return (ai < 0 ? editOrder.length : ai) - (bi < 0 ? editOrder.length : bi);
  });
  return _cache;
}
function imageMetadata(p, index) {
  const data = (p.imageMetadata || [])[index] || {};
  const dimension = (value, fallback) => Number.isInteger(value) && value > 0 ? value : fallback;
  return {
    width: dimension(data.width, 1086),
    height: dimension(data.height, 1448),
    thumbnail: data.thumbnail || p.images[index].replace(/\.jpg$/, '-thumb.webp'),
    thumbnailWidth: dimension(data.thumbnailWidth, 544)
  };
}
function imageHTML(p, index, extra = '') {
  const src = p.images[index];
  const meta = imageMetadata(p, index);
  const alt = index === 0 ? p.nameKr : '';
  return `<img src="${escapeHTML(src)}?v=20261031-premium1" srcset="${escapeHTML(meta.thumbnail)}?v=20261031-premium1 ${meta.thumbnailWidth}w, ${escapeHTML(src)}?v=20261031-premium1 ${meta.width}w" sizes="(max-width:600px) calc((100vw - 48px) / 2), (max-width:1000px) 31vw, 23vw" alt="${escapeHTML(alt)}" width="${meta.width}" height="${meta.height}" loading="lazy" decoding="async" ${extra}>`;
}
function detailImageHTML(p, index) {
  const meta = imageMetadata(p, index);
  const alt = `${p.nameKr} ${p.images.length === 1 ? '스타일링' : index === 0 ? '정면' : '다른 각도'}`;
  return `<img src="${escapeHTML(p.images[index])}?v=20261031-premium1" alt="${escapeHTML(alt)}" width="${meta.width}" height="${meta.height}" style="aspect-ratio:${meta.width}/${meta.height}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
function productCardHTML(p) {
  const tags = (p.tags || []).map(t => `<span class="product-tag">${escapeHTML(t)}</span>`).join('');
  return `<a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}"><div class="product-image">${tags ? `<div class="product-tags">${tags}</div>` : ''}${imageHTML(p,0)}${p.images[1] ? imageHTML(p,1,'class="img-back" aria-hidden="true"') : ''}</div><div class="product-info"><span class="product-cat">${escapeHTML(categoryLabel(p))}</span><span class="product-name">${escapeHTML(p.name)}</span><span class="product-name-kr">${escapeHTML(p.nameKr)}</span><span class="product-price">${priceLabel(p)}</span></div></a>`;
}
const loadError = '<div class="product-grid-empty" role="alert"><p>상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><a class="text-link" href="shop.html">컬렉션 다시 보기 <span>↗</span></a></div>';
(async () => {
  const featured = document.querySelector('[data-featured]');
  if (!featured) return;
  try { const products = await loadProducts(); featured.innerHTML = products.slice(0,Number(featured.dataset.featured)||8).map(productCardHTML).join(''); }
  catch(e) { featured.innerHTML = loadError; console.error(e); }
})();
(async () => {
  const grid = document.querySelector('[data-shop-grid]');
  if (!grid) return;
  try {
    const products = await loadProducts();
    let active = (new URLSearchParams(location.search).get('cat') || 'ALL').toUpperCase();
    const buttons = [...document.querySelectorAll('[data-filter]')];
    if (!buttons.some(button => button.dataset.filter === active)) active = 'ALL';
    const render = () => {
      const filtered = active === 'ALL' ? products : products.filter(p => active === 'PREMIUM' ? p.collection === 'PREMIUM EDIT' : p.category === active);
      buttons.forEach(b => { b.classList.toggle('active',b.dataset.filter === active); b.setAttribute('aria-pressed', String(b.dataset.filter === active)); });
      grid.innerHTML = filtered.length ? filtered.map(productCardHTML).join('') : '<div class="product-grid-empty"><p>이 카테고리에는 아직 상품이 없습니다.</p><a class="text-link" href="shop.html">전체 컬렉션 <span>↗</span></a></div>';
      document.querySelector('[data-product-count]').textContent = `${filtered.length} ITEMS`;
    };
    buttons.forEach(btn => btn.addEventListener('click', () => {
      active = btn.dataset.filter;
      const url = new URL(location.href);
      active === 'ALL' ? url.searchParams.delete('cat') : url.searchParams.set('cat',active);
      history.replaceState(null,'',url);
      render();
    }));
    render();
  } catch(e) {grid.innerHTML = loadError; console.error(e);}
})();
(async () => {
  const root = document.querySelector('[data-product-detail]');
  if (!root) return;
  try {
    const id = new URLSearchParams(location.search).get('id');
    const products = await loadProducts();
    const p = products.find(x => x.id === id);
    if (!p) {root.innerHTML='<div class="not-found"><span class="eyebrow">ILLPRO / COLLECTION</span><h1>상품을 찾을 수 없습니다.</h1><p>컬렉션에서 다른 상품을 만나보세요.</p><a class="btn-secondary" href="shop.html">컬렉션으로 돌아가기</a></div>'; return;}
    document.title = `${p.name} — ILLPRO`;
    const options = type => (p[type] || []).map((v,i) => `<button class="opt-btn${i===0?' active':''}" aria-pressed="${i===0}">${escapeHTML(v)}</button>`).join('');
    const inquiryOnly = p.inquiryOnly === true || !hasPrice(p);
    const optionsHTML = [['colors','COLOR','color-label'],['sizes','SIZE','size-label']].filter(([type]) => (p[type] || []).length).map(([type,label,labelId]) => `<span class="detail-option-label" id="${labelId}">${label}</span><div class="detail-options-row" role="group" aria-labelledby="${labelId}">${options(type)}</div>`).join('');
    const description = p.description.split('\n').filter(line => !line.includes('모델 정보:')).join('\n');
    root.innerHTML = `<div class="detail-images" role="region" aria-label="상품 이미지" tabindex="0">${p.images.map((_,i) => detailImageHTML(p,i)).join('')}</div><div class="detail-info"><nav class="breadcrumb" aria-label="현재 위치"><a href="index.html">ILLPRO</a><span>/</span><a href="shop.html">COLLECTION</a><span>/</span><a href="shop.html?cat=${encodeURIComponent(p.category)}">${escapeHTML(p.category)}</a></nav><div class="detail-cat">${escapeHTML(categoryLabel(p))} / ${escapeHTML(p.collection || '26 FW')}</div><h1>${escapeHTML(p.name)}</h1><div class="detail-name-kr">${escapeHTML(p.nameKr)}</div><div class="detail-price">${priceLabel(p)}</div>${optionsHTML ? `<div class="detail-options">${optionsHTML}</div>` : ''}<div class="detail-actions"><button class="btn-primary" data-add-bag aria-expanded="false" aria-controls="purchase-notice">${inquiryOnly ? '상품 안내' : '구매 안내'}</button><a class="btn-secondary" href="https://instagram.com/illpro.shop" target="_blank" rel="noopener">인스타그램으로 문의 ↗</a></div><p class="purchase-note" id="purchase-notice" role="status" hidden>${inquiryOnly ? '가격·사이즈 및 상품 관련 문의는 인스타그램 DM으로 연락해 주세요.' : '현재 온라인 결제를 준비하고 있습니다.<br>상품 관련 문의는 인스타그램 DM으로 연락해 주세요.'}</p><h2 class="detail-desc-title">${inquiryOnly ? 'STYLE NOTES' : 'DETAILS & CARE'}</h2><div class="detail-desc">${escapeHTML(description)}</div></div>`;
    root.querySelectorAll('.detail-options-row').forEach(row => row.addEventListener('click',e => {
      const btn=e.target.closest('.opt-btn'); if(!btn) return;
      row.querySelectorAll('.opt-btn').forEach(b => {b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});
    }));
    root.querySelector('[data-add-bag]').addEventListener('click', e => {
      const notice = root.querySelector('#purchase-notice');
      notice.hidden = !notice.hidden;
      e.currentTarget.setAttribute('aria-expanded', String(!notice.hidden));
    });
  } catch(e) {root.innerHTML=loadError;console.error(e);}
})();
