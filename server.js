const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================== HELPERS ====================

async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler database:', error);
        return null;
    }
}

async function writeDB(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao escrever no database:', error);
        return false;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email e senha são obrigatórios' 
        });
    }

    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const user = db.usuarios.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Email ou senha inválidos' 
        });
    }

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
        success: true, 
        message: 'Login realizado com sucesso',
        user: userWithoutPassword
    });
});

// Cadastro
app.post('/api/auth/cadastro', async (req, res) => {
    const userData = req.body;

    // Validações básicas
    if (!userData.email || !userData.password || !userData.nome || !userData.cpf) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios faltando' 
        });
    }

    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    // Verificar se email já existe
    if (db.usuarios.some(u => u.email === userData.email)) {
        return res.status(409).json({ 
            success: false, 
            message: 'Email já cadastrado' 
        });
    }

    // Verificar se CPF já existe
    if (db.usuarios.some(u => u.cpf === userData.cpf)) {
        return res.status(409).json({ 
            success: false, 
            message: 'CPF já cadastrado' 
        });
    }

    // Criar novo usuário
    const newUser = {
        id: generateId(),
        ...userData,
        dataCadastro: new Date().toISOString(),
        assinaturas: []
    };

    db.usuarios.push(newUser);
    
    if (await writeDB(db)) {
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            success: true, 
            message: 'Cadastro realizado com sucesso',
            user: userWithoutPassword
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar cadastro' 
        });
    }
});

// ==================== ROTAS DE PLANOS ====================

// Listar todos os planos
app.get('/api/planos', async (req, res) => {
    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    res.json({ 
        success: true, 
        planos: db.planos 
    });
});

// Buscar plano por ID
app.get('/api/planos/:id', async (req, res) => {
    const { id } = req.params;
    
    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const plano = db.planos.find(p => p.id === id);
    
    if (!plano) {
        return res.status(404).json({ 
            success: false, 
            message: 'Plano não encontrado' 
        });
    }

    res.json({ 
        success: true, 
        plano 
    });
});

// ==================== ROTAS DE PEDIDOS ====================

// Criar novo pedido
app.post('/api/pedidos', async (req, res) => {
    const pedidoData = req.body;

    if (!pedidoData.userId || !pedidoData.itens || !pedidoData.total) {
        return res.status(400).json({ 
            success: false, 
            message: 'Dados incompletos' 
        });
    }

    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const novoPedido = {
        id: generateId(),
        ...pedidoData,
        dataPedido: new Date().toISOString(),
        status: pedidoData.metodo === 'boleto' ? 'aguardando_pagamento' : 'aprovado'
    };

    // Se for boleto, gerar código de barras
    if (pedidoData.metodo === 'boleto') {
        novoPedido.codigoBarras = generateBoletoCode();
    }

    db.pedidos.push(novoPedido);

    // Adicionar assinatura ao usuário se aprovado
    if (novoPedido.status === 'aprovado') {
        const user = db.usuarios.find(u => u.id === pedidoData.userId);
        if (user) {
            pedidoData.itens.forEach(item => {
                user.assinaturas.push({
                    planoId: item.id,
                    planoNome: item.nome,
                    dataInicio: new Date().toISOString(),
                    status: 'ativa'
                });
            });
        }
    }

    if (await writeDB(db)) {
        res.status(201).json({ 
            success: true, 
            message: 'Pedido criado com sucesso',
            pedido: novoPedido
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar pedido' 
        });
    }
});

// Buscar pedidos do usuário
app.get('/api/pedidos/usuario/:userId', async (req, res) => {
    const { userId } = req.params;
    
    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const pedidos = db.pedidos.filter(p => p.userId === userId);
    
    res.json({ 
        success: true, 
        pedidos 
    });
});

// Buscar pedido por ID
app.get('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    
    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const pedido = db.pedidos.find(p => p.id === id);
    
    if (!pedido) {
        return res.status(404).json({ 
            success: false, 
            message: 'Pedido não encontrado' 
        });
    }

    res.json({ 
        success: true, 
        pedido 
    });
});

// Atualizar status do pedido
app.patch('/api/pedidos/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ 
            success: false, 
            message: 'Status é obrigatório' 
        });
    }

    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const pedido = db.pedidos.find(p => p.id === id);
    
    if (!pedido) {
        return res.status(404).json({ 
            success: false, 
            message: 'Pedido não encontrado' 
        });
    }

    pedido.status = status;
    pedido.dataAtualizacao = new Date().toISOString();

    // Se aprovado, adicionar assinatura
    if (status === 'aprovado') {
        const user = db.usuarios.find(u => u.id === pedido.userId);
        if (user) {
            pedido.itens.forEach(item => {
                user.assinaturas.push({
                    planoId: item.id,
                    planoNome: item.nome,
                    dataInicio: new Date().toISOString(),
                    status: 'ativa'
                });
            });
        }
    }

    if (await writeDB(db)) {
        res.json({ 
            success: true, 
            message: 'Status atualizado com sucesso',
            pedido
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar status' 
        });
    }
});

// ==================== ROTAS DE USUÁRIO ====================

// Buscar dados do usuário
app.get('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    
    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const user = db.usuarios.find(u => u.id === id);
    
    if (!user) {
        return res.status(404).json({ 
            success: false, 
            message: 'Usuário não encontrado' 
        });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
        success: true, 
        user: userWithoutPassword
    });
});

// Atualizar dados do usuário
app.patch('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const db = await readDB();
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor' 
        });
    }

    const userIndex = db.usuarios.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Usuário não encontrado' 
        });
    }

    // Não permitir atualização de email ou CPF para valores já existentes
    if (updateData.email && updateData.email !== db.usuarios[userIndex].email) {
        if (db.usuarios.some(u => u.email === updateData.email)) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email já cadastrado' 
            });
        }
    }

    db.usuarios[userIndex] = {
        ...db.usuarios[userIndex],
        ...updateData,
        dataAtualizacao: new Date().toISOString()
    };

    if (await writeDB(db)) {
        const { password: _, ...userWithoutPassword } = db.usuarios[userIndex];
        res.json({ 
            success: true, 
            message: 'Dados atualizados com sucesso',
            user: userWithoutPassword
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar dados' 
        });
    }
});

// ==================== HELPERS ====================

function generateBoletoCode() {
    const segments = [
        Math.floor(Math.random() * 90000 + 10000),
        Math.floor(Math.random() * 90000 + 10000),
        Math.floor(Math.random() * 90000 + 10000),
        Math.floor(Math.random() * 9 + 1),
        Math.floor(Math.random() * 900000000000 + 100000000000)
    ];
    return `${segments[0]}.${segments[1]} ${segments[2]}.${segments[3]} ${segments[4]}`;
}

// ==================== ROTA DE HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando',
        timestamp: new Date().toISOString()
    });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`✅ API: http://localhost:${PORT}/api/health`);
});