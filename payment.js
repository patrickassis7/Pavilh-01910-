// ==================== INICIALIZAÇÃO ====================

let metodoSelecionado = 'credit';
let carrinho = [];

document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
    exibirResumoCarrinho();
    configurarMascaras();
    configurarFormularios();
});

// ==================== CARREGAR CARRINHO ====================

function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }

    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        window.location.href = 'index.html';
    }
}

// ==================== EXIBIR RESUMO ====================

function exibirResumoCarrinho() {
    const orderItems = document.getElementById('orderItems');
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderTotal = document.getElementById('orderTotal');

    // Renderizar itens
    orderItems.innerHTML = carrinho.map(item => `
        <div class="order-item">
            <div class="order-item-name">${item.nome}</div>
            <div class="order-item-price">
                R$ ${item.preco.toFixed(2).replace('.', ',')}
                <span class="order-item-recurrence">/mês</span>
            </div>
        </div>
    `).join('');

    // Calcular total
    const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    orderSubtotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    orderTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // Configurar parcelamento (apenas para crédito)
    if (metodoSelecionado === 'credit') {
        configurarParcelamento(total);
    }
}

// ==================== SELEÇÃO DE MÉTODO ====================

function selecionarMetodo(metodo) {
    metodoSelecionado = metodo;

    // Atualizar botões
    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${metodo}"]`).classList.add('active');

    // Esconder todos os formulários
    document.getElementById('cardForm').style.display = 'none';
    document.getElementById('pixForm').style.display = 'none';
    document.getElementById('boletoForm').style.display = 'none';

    // Mostrar formulário selecionado
    if (metodo === 'credit' || metodo === 'debit') {
        document.getElementById('cardForm').style.display = 'block';
        
        // Mostrar/esconder parcelamento
        if (metodo === 'credit') {
            document.getElementById('installments').style.display = 'block';
            const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
            configurarParcelamento(total);
        } else {
            document.getElementById('installments').style.display = 'none';
        }
    } else if (metodo === 'pix') {
        document.getElementById('pixForm').style.display = 'block';
    } else if (metodo === 'boleto') {
        document.getElementById('boletoForm').style.display = 'block';
    }
}

// ==================== PARCELAMENTO ====================

function configurarParcelamento(valor) {
    const select = document.getElementById('installmentSelect');
    select.innerHTML = '';

    // Gerar opções de parcelamento (até 12x)
    const maxParcelas = 12;
    for (let i = 1; i <= maxParcelas; i++) {
        const valorParcela = valor / i;
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x de R$ ${valorParcela.toFixed(2).replace('.', ',')} ${i === 1 ? 'sem juros' : ''}`;
        select.appendChild(option);
    }
}

// ==================== MÁSCARAS ====================

function configurarMascaras() {
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCVV = document.getElementById('cardCVV');
    const cardCPF = document.getElementById('cardCPF');

    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
        });
    }

    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    if (cardCVV) {
        cardCVV.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    if (cardCPF) {
        cardCPF.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
            e.target.value = value;
        });
    }
}

// ==================== VALIDAÇÕES ====================

function validarCartao(numero) {
    // Remove espaços
    numero = numero.replace(/\s/g, '');
    
    // Verifica se tem 16 dígitos
    if (numero.length !== 16) return false;
    
    // Algoritmo de Luhn
    let soma = 0;
    let alternar = false;
    
    for (let i = numero.length - 1; i >= 0; i--) {
        let digito = parseInt(numero.charAt(i), 10);
        
        if (alternar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        
        soma += digito;
        alternar = !alternar;
    }
    
    return (soma % 10) === 0;
}

function validarValidade(validade) {
    const [mes, ano] = validade.split('/');
    
    if (!mes || !ano) return false;
    
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt('20' + ano, 10);
    
    if (mesNum < 1 || mesNum > 12) return false;
    
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    
    if (anoNum < anoAtual) return false;
    if (anoNum === anoAtual && mesNum < mesAtual) return false;
    
    return true;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

// ==================== FORMULÁRIOS ====================

function configurarFormularios() {
    const cardForm = document.getElementById('cardForm');
    
    if (cardForm) {
        cardForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(cardForm);
            const dados = Object.fromEntries(formData);
            
            // Validações
            if (!validarCartao(dados.cardNumber)) {
                mostrarMensagem('Número do cartão inválido', 'error');
                return;
            }
            
            if (!validarValidade(dados.cardExpiry)) {
                mostrarMensagem('Validade do cartão inválida ou expirada', 'error');
                return;
            }
            
            if (dados.cardCVV.length < 3 || dados.cardCVV.length > 4) {
                mostrarMensagem('CVV inválido', 'error');
                return;
            }
            
            if (!validarCPF(dados.cardCPF)) {
                mostrarMensagem('CPF inválido', 'error');
                return;
            }
            
            if (!dados.cardName.trim()) {
                mostrarMensagem('Nome do titular é obrigatório', 'error');
                return;
            }
            
            // Processar pagamento
            await processarPagamento(dados);
        });
    }
}

// ==================== PROCESSAR PAGAMENTO ====================

async function processarPagamento(dados) {
    const submitBtn = document.querySelector('.submit-payment');
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Processando...';
    submitBtn.disabled = true;

    // Simula processamento
    setTimeout(() => {
        // Salvar dados do pedido
        const pedido = {
            itens: carrinho,
            total: carrinho.reduce((sum, item) => sum + item.preco, 0),
            metodo: metodoSelecionado,
            data: new Date().toISOString(),
            status: 'aprovado'
        };

        localStorage.setItem('ultimoPedido', JSON.stringify(pedido));
        localStorage.removeItem('carrinho');

        // Redirecionar para confirmação
        window.location.href = 'confirmacao.html';
    }, 2500);
}

// ==================== PIX ====================

function copiarCodigoPix() {
    const input = document.querySelector('.pix-code input');
    input.select();
    document.execCommand('copy');
    
    const btn = document.querySelector('.copy-button');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Copiado!';
    btn.style.background = '#34c759';
    
    setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.style.background = '#ffeb3b';
    }, 2000);
}

// ==================== BOLETO ====================

function gerarBoleto() {
    const btn = event.target;
    btn.classList.add('loading');
    btn.textContent = 'Gerando Boleto...';
    btn.disabled = true;

    setTimeout(() => {
        const pedido = {
            itens: carrinho,
            total: carrinho.reduce((sum, item) => sum + item.preco, 0),
            metodo: 'boleto',
            data: new Date().toISOString(),
            status: 'aguardando_pagamento',
            codigoBarras: '23793.38128 60012.345678 90123.456789 1 23456789012345'
        };

        localStorage.setItem('ultimoPedido', JSON.stringify(pedido));
        localStorage.removeItem('carrinho');

        window.location.href = 'confirmacao.html';
    }, 2000);
}

// ==================== MENSAGENS ====================

function mostrarMensagem(texto, tipo = 'error') {
    // Remove mensagens antigas
    const mensagensAntigas = document.querySelectorAll('.message');
    mensagensAntigas.forEach(msg => msg.remove());

    // Cria nova mensagem
    const mensagem = document.createElement('div');
    mensagem.className = `message message-${tipo}`;
    mensagem.textContent = texto;

    // Insere no topo do formulário
    const form = document.querySelector('.payment-form');
    form.insertBefore(mensagem, form.firstChild);

    // Remove após 5 segundos
    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}

// Adicionar estilos de mensagem
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    .message {
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 600;
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .message-error {
        background: rgba(255, 59, 48, 0.2);
        border: 2px solid rgba(255, 59, 48, 0.5);
        color: #ff3b30;
    }

    .message-success {
        background: rgba(52, 199, 89, 0.2);
        border: 2px solid rgba(52, 199, 89, 0.5);
        color: #34c759;
    }
`;
document.head.appendChild(messageStyles);

window.selecionarMetodo = selecionarMetodo;