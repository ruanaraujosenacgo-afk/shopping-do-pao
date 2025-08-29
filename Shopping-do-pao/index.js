// ATENÇÃO: SUBSTITUA 'SUA_URL_DO_WEB_APP' pela URL que você copiou no Passo 2.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNOtkNO0p7CEsZYnglWvRt-P-Fxgxe1kxnQ8kEoDGeIzFyTaUj8tX_O1p5QKWvDWTk6w/exec';

// Onde os dados da planilha serão armazenados
const productDatabase = {};
const cart = [];

// Função para carregar os produtos da planilha via Google Apps Script
async function fetchProductsFromSheet() {
    try {
        // Faz a requisição para a URL do seu Web App.
        const response = await fetch(APPS_SCRIPT_URL);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao buscar dados do Apps Script: ${response.status} - ${response.statusText}. Resposta: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(`Erro retornado pelo Apps Script: ${result.error}`);
        }
        
        // Os dados já vêm formatados, é só atribuir ao banco de dados local.
        Object.assign(productDatabase, result);
        
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        // Aqui você pode adicionar um aviso visual para o usuário
        document.getElementById('padaria-products').innerHTML = '<p class="text-center text-red-500">Não foi possível carregar os produtos. Verifique a sua conexão</p>';
        document.getElementById('cafe-products').innerHTML = '';
        document.getElementById('confeitaria-products').innerHTML = '';
    }
}

const cartButton = document.getElementById('cart-button');
const closeCartButton = document.getElementById('close-cart-button');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

function renderProducts() {
    const padariaContainer = document.getElementById('padaria-products');
    const cafeContainer = document.getElementById('cafe-products');
    const confeitariaContainer = document.getElementById('confeitaria-products');
    
    // Filtra e renderiza apenas os produtos com status "Publicado"
    if (productDatabase.padaria) {
        const publicProducts = productDatabase.padaria.filter(p => p.status === 'Publicado');
        padariaContainer.innerHTML = publicProducts.map(p => createProductCard(p, 'padaria')).join('');
    }
    if (productDatabase.cafe) {
        const publicProducts = productDatabase.cafe.filter(p => p.status === 'Publicado');
        cafeContainer.innerHTML = publicProducts.map(p => createProductCard(p, 'cafe')).join('');
    }
    if (productDatabase.confeitaria) {
        const publicProducts = productDatabase.confeitaria.filter(p => p.status === 'Publicado');
        confeitariaContainer.innerHTML = publicProducts.map(p => createProductCard(p, 'confeitaria')).join('');
    }
    
    addEventListenersToButtons();
}

function createProductCard(product, section) {
  // Agora o produto.image já contém o link completo da imagem
  return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col sm:flex-row md:flex-col">
      <img src="${product.image}" alt="${product.name}" class="w-full h-52 sm:h-24 md:h-56 object-cover">
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">${product.name}</h3>
        <p class="text-gray-500 text-xs sm:text-sm mb-2">${product.description}</p>
        <p class="text-lg sm:text-2xl font-bold text-orange-600 mb-2 sm:mb-4 mt-auto">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
        <button class="add-to-cart-btn mt-auto w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-full transition duration-300 text-xs sm:text-sm"
          data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
          Adicionar
        </button>
      </div>
    </div>
  `;
}

function addEventListenersToButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const { id, name, price, image, description } = e.target.dataset;
            addToCart({ id, name, price: parseFloat(price), image, description });
        });
    });
}       

function addToCart(product) {
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    // Calcula o valor total do carrinho
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Seu carrinho está vazio.</p>';
    checkoutButton.disabled = true;
} else {
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between mb-4 p-2 rounded-md bg-gray-50 cart-item-enter">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-md object-cover mr-4">
            <div class="flex-grow">
                <h4 class="font-semibold">${item.name}</h4>
                <p class="text-gray-500 text-xs">${item.description}</p> 
                <p class="text-gray-600">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                <div class="flex items-center mt-1">
                    <button class="quantity-change bg-gray-200 rounded-full h-6 w-6 flex items-center justify-center" data-id="${item.id}" data-change="-1">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="quantity-change bg-gray-200 rounded-full h-6 w-6 flex items-center justify-center" data-id="${item.id}" data-change="1">+</button>
                </div>
            </div>
            <button class="remove-from-cart text-red-500 hover:text-red-700" data-id="${item.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
            </button>
        </div>
    `).join('');
        
        // Adiciona a verificação do valor mínimo
        if (total < 20) {
            cartItemsContainer.innerHTML += '<p class="text-red-500 text-center mt-4">O valor mínimo do pedido é de R$ 20,00.</p>';
            checkoutButton.disabled = true;
        } else {
            checkoutButton.disabled = false;
        }
    }

    // Atualiza o total e o contador de itens (já existia no seu código)
    cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.classList.toggle('hidden', totalItems === 0);


    addCartInteractionListeners();
}

function addCartInteractionListeners() {
    document.querySelectorAll('.quantity-change').forEach(button => {
        button.addEventListener('click', e => {
            const { id, change } = e.currentTarget.dataset;
            changeQuantity(id, parseInt(change));
        });
    });

    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', e => {
            const { id } = e.currentTarget.dataset;
            removeFromCart(id);
        });
    });
}

function changeQuantity(productId, change) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity += change;
        if (product.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function removeFromCart(productId) {
    const productIndex = cart.findIndex(item => item.id === productId);
    if (productIndex > -1) {
        cart.splice(productIndex, 1);
        updateCart();
    }
}

function toggleCart() {
    cartSidebar.classList.toggle('translate-x-full');
    cartOverlay.classList.toggle('hidden');
}

function generateWhatsAppMessage() {
    const phoneNumber = '5561994327681';
    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    
    cart.forEach(item => {
        const subtotal = (item.price * item.quantity).toFixed(2).replace('.', ',');
        message += `*${item.name}*\n`;
        message += `Quantidade: ${item.quantity}\n`;
        message += `Subtotal: R$ ${subtotal}\n\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    message += `*Total do Pedido: R$ ${total.toFixed(2).replace('.', ',')}*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

document.addEventListener('DOMContentLoaded', async () => {
    cartButton.addEventListener('click', toggleCart);
    closeCartButton.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    checkoutButton.addEventListener('click', generateWhatsAppMessage);
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });

    const heroSwiper = new Swiper('.hero-swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    // Chama a nova função para buscar os dados e depois renderiza
    await fetchProductsFromSheet();
    renderProducts();
    updateCart();
});
