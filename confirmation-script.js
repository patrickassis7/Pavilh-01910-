// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
    exibirConfirmacao();
});

// ==================== EXIBIR CONFIRMAÇÃO ====================

function exibirConfirmacao() {
    const pedido = JSON.parse(localStorage.getItem('ultimoPedido'));
    const content = document.getElementById('confirmationContent');

    if (!pedido) {
        content.innerHTML = `
            <div class="success-icon">❌</div>
            <h1>Pedido não encontrado</h1>
            <p>Não encontramos informações sobre seu pedido.</p>
            <div class="action-buttons">
                <a href="index.html" class="btn btn-primary">Voltar ao Início</a>
            </div>
        `;
        return;
    }

    // Formatar data
    const data = new Date(pedido.data);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determinar método de pagamento
    let metodoPagamento = '';
    switch(pedido.metodo) {
        case 'credit':
            metodoPagamento = 'Cartão de Crédito';
            break;
        case 'debit':
            metodoPagamento = 'Cartão de Débito';
            break;
        case 'pix':
            metodoPagamento = 'PIX';
            break;
        case 'boleto':
            metodoPagamento = 'Boleto Bancário';
            break;
    }

    // Renderizar itens
    const itensHTML = pedido.itens.map(item => `
        <div class="order-item">
            <span class="item-name">${item.nome}</span>
            <span class="item-price">R$ ${item.preco.toFixed(2).replace('.', ',')}/mês</span>
        </div>
    `).join('');

    // Conteúdo específico para boleto
    let conteudoAdicional = '';
    if (pedido.metodo === 'boleto') {
        conteudoAdicional = `
            <div class="boleto-info">
                <h3>📄 Informações do Boleto</h3>
                <p>Seu boleto foi gerado com sucesso! Efetue o pagamento até a data de vencimento.</p>
                <div class="boleto-code">
                    ${pedido.codigoBarras}
                </div>
                <div class="boleto-instructions">
                    <strong>Instruções:</strong>
                    <ul>
                        <li>O boleto vence em 3 dias úteis</li>
                        <li>Você também receberá o boleto por e-mail</li>
                        <li>Após o pagamento, aguarde até 2 dias úteis para confirmação</li>
                        <li>Sua assinatura será ativada automaticamente após a confirmação</li>
                    </ul>
                </div>
            </div>
        `;
    } else if (pedido.metodo === 'pix') {
        conteudoAdicional = `
            <div class="payment-method-info">
                <strong>✅ Pagamento via PIX</strong>
                <p>Aguardando confirmação do pagamento. Assim que o PIX for processado, você receberá um e-mail de confirmação.</p>
            </div>
        `;
    } else {
        conteudoAdicional = `
            <div class="payment-method-info">
                <strong>✅ Pagamento Aprovado</strong>
                <p>Sua assinatura foi ativada com sucesso! Você já pode aproveitar todos os benefícios do FIEL Torcedor.</p>
            </div>
        `;
    }

    // Montar HTML completo
    content.innerHTML = `
        <div class="success-icon">✅</div>
        <h1>${pedido.metodo === 'boleto' ? 'Pedido Confirmado!' : 'Pagamento Aprovado!'}</h1>
        <p>
            ${pedido.metodo === 'boleto' 
                ? 'Seu pedido foi registrado com sucesso! Efetue o pagamento do boleto para ativar sua assinatura.' 
                : 'Parabéns! Você agora faz parte da FIEL Torcedor. Bem-vindo à maior torcida do Brasil!'}
        </p>

        ${conteudoAdicional}

        <div class="order-details">
            <h2>Detalhes do Pedido</h2>
            
            <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${dataFormatada}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Forma de Pagamento:</span>
                <span class="detail-value">${metodoPagamento}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${pedido.status === 'aprovado' ? '✅ Aprovado' : '⏳ Aguardando Pagamento'}</span>
            </div>

            <div class="order-items">
                ${itensHTML}
            </div>

            <div class="total-row">
                <span>Total:</span>
                <span class="total-value">R$ ${pedido.total.toFixed(2).replace('.', ',')}/mês</span>
            </div>
        </div>

        <div class="action-buttons">
            <a href="index.html" class="btn btn-primary">Voltar ao Início</a>
            ${pedido.metodo === 'boleto' ? '<button class="btn btn-secondary" onclick="imprimirBoleto()">Imprimir Boleto</button>' : ''}
        </div>
    `;
}

// ==================== IMPRIMIR BOLETO ====================

function imprimirBoleto() {
    window.print();
}

// ==================== LIMPAR PEDIDO AO SAIR ====================

window.addEventListener('beforeunload', function() {
    // Mantém o pedido salvo para o usuário poder acessar depois
    // Mas você pode descomentar a linha abaixo para limpar
    // localStorage.removeItem('ultimoPedido');
});