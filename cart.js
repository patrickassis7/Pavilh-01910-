// ==================== CARRINHO DE COMPRAS ====================

let carrinho = [];

// Carregar carrinho do localStorage ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
    atualizarContadorCarrinho();
});

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Carregar carrinho do localStorage
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
}

// Adicionar item ao carrinho
function adicionarAoCarrinho(id, nome, preco) {
    // Verifica se o plano já está no carrinho
    const itemExistente = carrinho.find(item => item.id === id);
    
    if (itemExistente) {
        mostrarNotificacao('Este plano já está no seu carrinho!', 'info');
        abrirCarrinho();
        return;
    }

    // Adiciona novo item
    const item = {
        id: id,
        nome: nome,
        preco: preco
    };

    carrinho.push(item);
    salvarCarrinho();
    atualizarCarrinho();
    atualizarContadorCarrinho();
    abrirCarrinho();
    mostrarNotificacao('Plano adicionado ao carrinho!', 'success');
}

// Remover item do carrinho
function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    salvarCarrinho();
    atualizarCarrinho();
    atualizarContadorCarrinho();
    mostrarNotificacao('Plano removido do carrinho', 'info');
}

// Atualizar exibição do carrinho
function atualizarCarrinho() {
    const cartItems = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');

    if (carrinho.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        subtotalElement.textContent = 'R$ 0,00';
        totalElement.textContent = 'R$ 0,00';
        return;
    }

    // Renderizar itens
    cartItems.innerHTML = carrinho.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-name">${item.nome}</div>
                <button class="remove-item" onclick="removerDoCarrinho('${item.id}')">
                    Remover
                </button>
            </div>
            <div class="cart-item-price">
                R$ ${item.preco.toFixed(2).replace('.', ',')}
                <span class="cart-item-recurrence">/mês</span>
            </div>
        </div>
    `).join('');

    // Calcular total
    const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    subtotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Atualizar contador do carrinho
function atualizarContadorCarrinho() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = carrinho.length;
    }
}

// Abrir carrinho
function abrirCarrinho() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    atualizarCarrinho();
}

// Fechar carrinho
function fecharCarrinho() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Ir para página de pagamento
function irParaPagamento() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Adicione um plano ao carrinho primeiro!', 'error');
        return;
    }

    // Salva o carrinho e redireciona
    salvarCarrinho();
    window.location.href = 'pagamento.html';
}

// Notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificações antigas
    const notificacoesAntigas = document.querySelectorAll('.notification');
    notificacoesAntigas.forEach(n => n.remove());

    // Cria nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notification notification-${tipo}`;
    notificacao.textContent = mensagem;

    document.body.appendChild(notificacao);

    // Anima entrada
    setTimeout(() => notificacao.classList.add('show'), 10);

    // Remove após 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Adicionar estilos de notificação dinamicamente
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: -400px;
        background: #fff;
        color: #000;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        font-weight: 600;
        transition: right 0.3s ease;
        max-width: 350px;
    }

    .notification.show {
        right: 30px;
    }

    .notification-success {
        background: #34c759;
        color: #fff;
    }

    .notification-error {
        background: #ff3b30;
        color: #fff;
    }

    .notification-info {
        background: #ffeb3b;
        color: #000;
    }
`;
document.head.appendChild(notificationStyles);