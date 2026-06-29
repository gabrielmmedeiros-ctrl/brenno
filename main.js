function formatPrice(value) {
  return Number(value || 0)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parsePrice(text) {
  if (!text) return 0;
  const cleaned = String(text)
    .replace(/\s/g, '')
    .replace(/R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getCart() {
  const raw = localStorage.getItem('shopfacil_cart');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('shopfacil_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById('contadorCarrinho');
  if (!badge) return;
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  badge.innerText = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function getDetailProductData() {
  const titleEl = document.querySelector('.info-produto h1');
  const priceEl = document.querySelector('.preco-produto h2');
  const name = titleEl ? titleEl.innerText.trim() : '';
  const priceText = priceEl ? priceEl.innerText : '';
  const price = parsePrice(priceText);
  const principalImage = document.getElementById('imagemPrincipal');
  const imagem = principalImage ? principalImage.src : '';
  const corSelecionada = document.getElementById('corSelecionada');
  const corAtiva = document.querySelector('.cores button.ativo');
  const color = (corSelecionada && corSelecionada.value) || (corAtiva && corAtiva.dataset && corAtiva.dataset.cor) || '';
  const sizeInput = document.getElementById('tamanhoSelecionado');
  const sizeButton = document.querySelector('.tamanhos button.ativo');
  const size = (sizeInput && sizeInput.value) || (sizeButton ? sizeButton.innerText : '');
  const saborSelecionado = document.getElementById('saborSelecionado');
  const saborAtivo = document.querySelector('.sabores-produto button.ativo');
  const flavor = (saborSelecionado && saborSelecionado.value) || (saborAtivo && saborAtivo.dataset && saborAtivo.dataset.sabor) || '';
  const quantityInput = document.getElementById('quantidade');
  const quantity = parseInt(quantityInput ? quantityInput.value : '', 10) || 1;
  const detail = window.location.pathname.split('/').pop();
  return {
    id: `${name}|${color}|${size}|${flavor}`,
    name,
    price,
    quantity,
    image: imagem,
    detail,
    color,
    size,
    flavor,
  };
}

function addToCart(item) {
  if (!item.name || !item.price) {
    alert('Não foi possível adicionar o produto ao carrinho.');
    return;
  }

  const normalizedItem = {
    ...item,
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
  };

  const cart = getCart();
  const index = cart.findIndex((product) => {
    const sameProduct =
      product.id === normalizedItem.id &&
      product.name === normalizedItem.name &&
      Number(product.price) === normalizedItem.price &&
      (product.color || '') === (normalizedItem.color || '') &&
      (product.size || '') === (normalizedItem.size || '') &&
      (product.flavor || '') === (normalizedItem.flavor || '');

    return sameProduct;
  });

  if (index >= 0) {
    cart[index].quantity += normalizedItem.quantity;
  } else {
    cart.push(normalizedItem);
  }

  saveCart(cart);
  updateCartBadge();
  if (window.dispatchEvent) {
    window.dispatchEvent(new Event('cartUpdated'));
  }
}

function adicionarAoCarrinho(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const item = getDetailProductData();
  addToCart(item);
  alert('Produto adicionado ao carrinho!');
}

function trocarImagem(elemento) {
  if (!elemento) return;
  document.querySelectorAll('.miniaturas img').forEach((item) => item.classList.remove('ativa'));
  elemento.classList.add('ativa');
  const principal = document.getElementById('imagemPrincipal');
  if (principal) {
    principal.src = elemento.src;
    principal.alt = elemento.alt || principal.alt;
  }
}

function selecionarCor(botao, imagemSrc) {
  if (!botao) return;
  document.querySelectorAll('.cores button').forEach((item) => item.classList.remove('ativo'));
  botao.classList.add('ativo');

  const principal = document.getElementById('imagemPrincipal');
  if (principal && imagemSrc) {
    principal.src = imagemSrc;
  }

  const corSelecionada = document.getElementById('corSelecionada');
  if (corSelecionada) {
    corSelecionada.value = botao.dataset.cor || botao.getAttribute('data-cor') || '';
  }
}

function selecionarTamanho(botao) {
  if (!botao) return;
  document.querySelectorAll('.tamanhos button').forEach((item) => item.classList.remove('ativo'));
  botao.classList.add('ativo');

  const tamanhoSelecionado = document.getElementById('tamanhoSelecionado');
  if (tamanhoSelecionado) {
    tamanhoSelecionado.value = botao.innerText.trim();
  }

  const tamanhoTexto = document.getElementById('tamanhoSelecionadoTexto');
  if (tamanhoTexto) {
    tamanhoTexto.innerText = `Tamanho selecionado: ${tamanhoSelecionado ? tamanhoSelecionado.value : botao.innerText.trim()}`;
  }
}

function selecionarSabor(botao, sabor) {
  if (!botao) return;
  document.querySelectorAll('.sabor-produto').forEach((item) => item.classList.remove('ativo'));
  botao.classList.add('ativo');
  const saborSelecionado = document.getElementById('saborSelecionado');
  if (saborSelecionado) {
    saborSelecionado.setAttribute('value', sabor);
  }
}

function calcularTotal(event) {
  if (event) event.preventDefault();
  const quantidadeInput = document.getElementById('quantidade');
  const quantidade = parseInt(quantidadeInput ? quantidadeInput.value : '', 10) || 1;
  const precoEl = document.querySelector('.preco-produto h2');
  const preco = parsePrice(precoEl ? precoEl.innerText : '0');
  const total = quantidade * preco;
  const tamanhoSelecionado = document.getElementById('tamanhoSelecionado');
  const saborSelecionado = document.getElementById('saborSelecionado');
  const tamanho = tamanhoSelecionado ? tamanhoSelecionado.value : '';
  const sabor = saborSelecionado ? saborSelecionado.value : '';
  let detalhe = `Total: R$ ${formatPrice(total)}`;
  if (tamanho) detalhe += ` | Tamanho: ${tamanho}`;
  if (sabor) detalhe += ` | Sabor: ${sabor}`;
  const totalEl = document.getElementById('total');
  if (totalEl) {
    totalEl.innerText = detalhe;
  }
}

function applyProductFilters() {
  const searchInput = document.getElementById('buscaProdutos');
  const query = normalizeText(searchInput ? searchInput.value.trim() : '');
  const categoryCheckboxes = Array.from(document.querySelectorAll('.filtros input[type="checkbox"][data-category]'));
  const selectedCategories = categoryCheckboxes
    .filter((input) => input.checked)
    .map((input) => normalizeText(input.dataset.category));
  const selectedPrices = Array.from(document.querySelectorAll('.filtros input[type="checkbox"][name="preco"]:checked')).map((input) => input.dataset.price);
  const ratingCheckboxes = Array.from(document.querySelectorAll('.filtros input[type="checkbox"][data-rating]'));
  const selectedRatings = ratingCheckboxes.filter((input) => input.checked).map((input) => Number(input.dataset.rating));
  const cards = Array.from(document.querySelectorAll('.card-produto'));

  let visibleCount = 0;

  cards.forEach((card) => {
    const title = normalizeText(card.querySelector('h3')?.innerText || '');
    const description = normalizeText(card.querySelector('p')?.innerText || '');
    const categories = normalizeText(card.dataset.category || '');
    const priceText = card.querySelector('.preco')?.innerText || '0';
    const price = parsePrice(priceText);
    const ratingText = card.querySelector('.avaliacao')?.innerText || '';
    const rating = (ratingText.match(/★/g) || []).length;

    const matchesSearch = query === '' || title.includes(query) || description.includes(query);
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((category) => categories.includes(category));

    let matchesPrice = true;
    if (selectedPrices.length > 0) {
      matchesPrice = selectedPrices.some((priceOption) => {
        if (priceOption === 'ate100') return price <= 100;
        if (priceOption === '100-300') return price > 100 && price <= 300;
        if (priceOption === 'acima300') return price > 300;
        return true;
      });
    }

    const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(rating);
    const visible = matchesSearch && matchesCategory && matchesPrice && matchesRating;
    card.style.display = visible ? '' : 'none';
    if (visible) visibleCount += 1;
  });

  const contador = document.getElementById('contagemProdutos');
  if (contador) {
    contador.innerText = `Mostrando ${visibleCount} produto${visibleCount === 1 ? '' : 's'}`;
  }
}

function initProductFilters() {
  const searchInput = document.getElementById('buscaProdutos');
  if (!searchInput) return;

  searchInput.addEventListener('input', applyProductFilters);
  document.querySelectorAll('.filtros input[type="checkbox"][data-category]').forEach((input) => {
    input.addEventListener('change', applyProductFilters);
  });
  document.querySelectorAll('.filtros input[type="checkbox"][name="preco"]').forEach((input) => {
    input.addEventListener('change', applyProductFilters);
  });
  document.querySelectorAll('.filtros input[type="checkbox"][data-rating]').forEach((input) => {
    input.addEventListener('change', applyProductFilters);
  });

  const params = new URLSearchParams(window.location.search);
  const categoria = params.get('categoria');
  if (categoria) {
    const checkbox = document.querySelector(`.filtros input[data-category="${categoria}"]`);
    if (checkbox) {
      checkbox.checked = true;
    }
  }
  applyProductFilters();
}

function renderCartPage() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  const cart = getCart();
  if (!cart.length) {
    container.innerHTML = `
      <div class="carrinho-vazio">
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione produtos para montar seu pedido aqui.</p>
        <a href="produtos.html" class="botao">Explorar produtos</a>
      </div>
    `;
    return;
  }

  const rows = cart
    .map(
      (item, index) => `
      <div class="carrinho-item">
        <div class="carrinho-item-imagem">
          <img src="${item.image || 'img/logo.png'}" alt="${item.name}">
        </div>
        <div class="carrinho-item-info">
          <h3>${item.name}</h3>
          <p>${item.color ? `Cor: ${item.color}` : 'Cor: Padrão'}</p>
          ${item.size ? `<p>Tamanho: ${item.size}</p>` : ''}
          ${item.flavor ? `<p>Sabor: ${item.flavor}</p>` : ''}
          <div class="carrinho-controles">
            <button class="controle-quantidade" onclick="changeQuantity(${index}, -1)">−</button>
            <span>${item.quantity}</span>
            <button class="controle-quantidade" onclick="changeQuantity(${index}, 1)">+</button>
          </div>
        </div>
        <div class="carrinho-item-actions">
          <p class="carrinho-preco">R$ ${formatPrice(item.price * item.quantity)}</p>
          <button class="remover-item" onclick="removeFromCart(${index})">Remover</button>
        </div>
      </div>
    `
    )
    .join('');

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  container.innerHTML = `
    <div class="carrinho-header">
      <div>
        <h2>Meu Carrinho</h2>
        <p>${cart.length} item${cart.length === 1 ? '' : 's'} no pedido</p>
      </div>
      <button class="limpar-carrinho" onclick="clearCart()">Limpar carrinho</button>
    </div>
    <div class="carrinho-layout">
      <div class="carrinho-lista">${rows}</div>
      <aside class="carrinho-resumo">
        <h3>Resumo</h3>
        <div class="resumo-linha">
          <span>Subtotal</span>
          <strong>R$ ${formatPrice(totalPrice)}</strong>
        </div>
        <div class="resumo-linha">
          <span>Frete</span>
          <strong>Grátis</strong>
        </div>
        <div class="resumo-total">
          <span>Total</span>
          <strong>R$ ${formatPrice(totalPrice)}</strong>
        </div>
        <a href="produtos.html" class="botao botao-block">Continuar comprando</a>
        <button class="botao botao-block" onclick="alert('Pedido finalizado com sucesso!')">Finalizar compra</button>
      </aside>
    </div>
  `;
}

function changeQuantity(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;

  cart[index].quantity = Math.max(0, (Number(cart[index].quantity) || 1) + delta);

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  updateCartBadge();
  renderCartPage();
  if (window.dispatchEvent) {
    window.dispatchEvent(new Event('cartUpdated'));
  }
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartBadge();
  renderCartPage();
  if (window.dispatchEvent) {
    window.dispatchEvent(new Event('cartUpdated'));
  }
}

function clearCart() {
  localStorage.removeItem('shopfacil_cart');
  updateCartBadge();
  renderCartPage();
  if (window.dispatchEvent) {
    window.dispatchEvent(new Event('cartUpdated'));
  }
}

function initPage() {
  initProductFilters();
  updateCartBadge();
  renderCartPage();
  window.addEventListener('storage', () => {
    updateCartBadge();
    renderCartPage();
  });
}

window.addEventListener('DOMContentLoaded', initPage);
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.trocarImagem = trocarImagem;
window.selecionarCor = selecionarCor;
window.selecionarTamanho = selecionarTamanho;
window.selecionarSabor = selecionarSabor;
window.calcularTotal = calcularTotal;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.changeQuantity = changeQuantity;
