// ==================== MÁSCARAS DE ENTRADA ====================

// Máscara de CPF
function mascaraCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

// Máscara de Telefone
function mascaraTelefone(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

// Máscara de CEP
function mascaraCEP(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

// Aplicar máscaras nos campos
document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const cepInput = document.getElementById('cep');

    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            e.target.value = mascaraCPF(e.target.value);
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            e.target.value = mascaraTelefone(e.target.value);
        });
    }

    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            e.target.value = mascaraCEP(e.target.value);
        });

        // Buscar CEP quando completo
        cepInput.addEventListener('blur', buscarCEP);
    }
});

// ==================== API DE CEP (ViaCEP) ====================

async function buscarCEP() {
    const cepInput = document.getElementById('cep');
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        return;
    }

    // Adiciona loading
    cepInput.classList.add('loading');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            mostrarMensagem('CEP não encontrado', 'error');
            limparEndereco();
        } else {
            preencherEndereco(data);
        }
    } catch (error) {
        mostrarMensagem('Erro ao buscar CEP. Tente novamente.', 'error');
        console.error('Erro:', error);
    } finally {
        cepInput.classList.remove('loading');
    }
}

function preencherEndereco(dados) {
    document.getElementById('logradouro').value = dados.logradouro || '';
    document.getElementById('bairro').value = dados.bairro || '';
    document.getElementById('cidade').value = dados.localidade || '';
    document.getElementById('estado').value = dados.uf || '';

    // Focar no campo número
    document.getElementById('numero').focus();
}

function limparEndereco() {
    document.getElementById('logradouro').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';
}

// ==================== VALIDAÇÕES ====================

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
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

function validarSenha(senha) {
    return senha.length >= 8;
}

// ==================== MENSAGENS ====================

function mostrarMensagem(texto, tipo = 'success') {
    // Remove mensagens antigas
    const mensagensAntigas = document.querySelectorAll('.message');
    mensagensAntigas.forEach(msg => msg.remove());

    // Cria nova mensagem
    const mensagem = document.createElement('div');
    mensagem.className = `message ${tipo}`;
    mensagem.textContent = texto;

    // Insere no início do formulário
    const form = document.querySelector('.auth-form');
    form.insertBefore(mensagem, form.firstChild);

    // Remove após 5 segundos
    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}

// ==================== FORM DE LOGIN ====================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validações
        if (!validarEmail(email)) {
            mostrarMensagem('Por favor, insira um e-mail válido', 'error');
            return;
        }

        if (!validarSenha(password)) {
            mostrarMensagem('A senha deve ter no mínimo 8 caracteres', 'error');
            return;
        }

        // Simula loading
        const submitBtn = loginForm.querySelector('.submit-button');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Entrando...';

        // Simula requisição
        setTimeout(() => {
            // Salva dados no localStorage (simulação)
            const usuario = {
                email: email,
                logado: true,
                dataLogin: new Date().toISOString()
            };
            localStorage.setItem('usuario', JSON.stringify(usuario));

            mostrarMensagem('Login realizado com sucesso!', 'success');
            
            // Redireciona após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 1500);
    });
}

// ==================== FORM DE CADASTRO ====================

const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
    cadastroForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(cadastroForm);
        const dados = Object.fromEntries(formData);

        // Validações
        if (!validarEmail(dados.email)) {
            mostrarMensagem('Por favor, insira um e-mail válido', 'error');
            return;
        }

        if (!validarCPF(dados.cpf)) {
            mostrarMensagem('CPF inválido', 'error');
            return;
        }

        if (!validarSenha(dados.password)) {
            mostrarMensagem('A senha deve ter no mínimo 8 caracteres', 'error');
            return;
        }

        if (dados.password !== dados.confirmPassword) {
            mostrarMensagem('As senhas não coincidem', 'error');
            return;
        }

        if (!formData.get('termos')) {
            mostrarMensagem('Você deve aceitar os termos de uso', 'error');
            return;
        }

        // Simula loading
        const submitBtn = cadastroForm.querySelector('.submit-button');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Criando conta...';

        // Simula requisição
        setTimeout(() => {
            // Salva dados no localStorage (simulação)
            const usuario = {
                nome: dados.nome,
                email: dados.email,
                cpf: dados.cpf,
                telefone: dados.telefone,
                dataNascimento: dados.dataNascimento,
                endereco: {
                    cep: dados.cep,
                    logradouro: dados.logradouro,
                    numero: dados.numero,
                    complemento: dados.complemento,
                    bairro: dados.bairro,
                    cidade: dados.cidade,
                    estado: dados.estado
                },
                dataCadastro: new Date().toISOString()
            };
            
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('usuarioCadastrado', 'true');

            mostrarMensagem('Conta criada com sucesso!', 'success');
            
            // Redireciona após 1.5 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }, 2000);
    });
}

// ==================== LOGOUT ====================

function logout() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// ==================== VERIFICAR LOGIN ====================

function verificarLogin() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// ==================== SOCIAL LOGIN (Simulação) ====================

document.querySelectorAll('.social-button').forEach(button => {
    button.addEventListener('click', function() {
        const tipo = this.classList.contains('google') ? 'Google' : 'Facebook';
        mostrarMensagem(`Login com ${tipo} em desenvolvimento`, 'error');
    });
});