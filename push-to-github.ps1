
# Verify git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git não encontrado. Instale Git antes de rodar este script: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

$cwd = Get-Location
Write-Host "Executando em: $cwd"

# Ask user if they want to remove existing .git (if any)
if (Test-Path -Path "$cwd\.git") {
    $choice = Read-Host "Já existe um repositório Git local. Deseja remover .git e reiniciar? (s/N)"
    if ($choice -eq 's' -or $choice -eq 'S') {
        Remove-Item -Recurse -Force "$cwd\.git"
        Write-Host ".git removido. Reiniciando..."
    } else {
        Write-Host "Usando repositório Git existente. Pulando git init."
    }
}

# Initialize repo if needed
if (-not (Test-Path -Path "$cwd\.git")) {
    git init -b main
    Write-Host "Repositório git inicializado (branch main)."
}

# Add all files and commit
git add .
$commitMsg = "Initial commit: Pavilhão 1910 site"
# Only commit if there are staged changes
$changes = git diff --cached --name-only
if ($changes) {
    git commit -m "$commitMsg"
    Write-Host "Commit criado: $commitMsg"
} else {
    Write-Host "Nada a commitar (não há alterações staged)."
}

# Ask for remote URL
$remoteUrl = Read-Host "Cole aqui a URL do remote (ex: https://github.com/SEU-USUARIO/pavilhao-1910.git) ou pressione Enter se já tiver remote configurado"
if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
    # If remote origin already exists, use it
    $remotes = git remote -v
    if ($remotes -notmatch 'origin') {
        Write-Host "Nenhum remote origin configurado e nada foi fornecido. Não posso fazer push. Saindo." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "Usando remote existente."
    }
} else {
    # If origin exists, ask if overwrite
    $existing = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0) {
        $choice = Read-Host "Remote origin já existe com URL: $existing. Deseja sobrescrever? (s/N)"
        if ($choice -eq 's' -or $choice -eq 'S') {
            git remote remove origin
            git remote add origin $remoteUrl
            Write-Host "Remote origin atualizado para: $remoteUrl"
        } else {
            Write-Host "Mantendo origin existente."
        }
    } else {
        git remote add origin $remoteUrl
        Write-Host "Remote origin adicionado: $remoteUrl"
    }
}

# Ensure main branch name and push
git branch -M main
Write-Host "Fazendo push para origin/main... (pode pedir credenciais)"
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Push concluído com sucesso! Abra: https://github.com/SEU-USUARIO/pavilhao-1910" -ForegroundColor Green
} else {
    Write-Host "Push falhou. Verifique mensagens acima (autenticação / URL / rede)." -ForegroundColor Red
}
