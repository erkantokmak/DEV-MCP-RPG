/**
 * Dev-RPG CI/CD Pipeline
 * 
 * Bu Jenkinsfile, kod değişikliklerini Dev-RPG analiz platformuna gönderir
 * ve sonuçları raporlar.
 * 
 * Gereksinimler:
 * - Jenkins HTTP Request Plugin
 * - Jenkins Pipeline Plugin
 * - Jenkins Git Plugin
 * 
 * Ortam Değişkenleri (Jenkins Credentials'da tanımlanmalı):
 * - DEV_RPG_URL: Dev-RPG Backend API URL (varsayılan: http://localhost:3210)
 * - DEV_RPG_N8N_URL: n8n Webhook URL (varsayılan: http://localhost:3220)
 */

pipeline {
    agent any
    
    environment {
        // Dev-RPG servis URL'leri - Jenkins credentials veya environment variables'dan alınır
        DEV_RPG_API_URL = credentials('dev-rpg-api-url') ?: 'http://dev-rpg-backend:3210'
        DEV_RPG_N8N_URL = credentials('dev-rpg-n8n-url') ?: 'http://dev-rpg-n8n:5678'
        
        // Proje bilgileri
        PROJECT_ID = credentials('dev-rpg-project-id') ?: ''
        // USER_ID = credentials('dev-rpg-user-id') ?: ''
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    env.GIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                }
            }
        }
        
        stage('Check Dev-RPG Health') {
            steps {
                script {
                    try {
                        def response = httpRequest(
                            url: "${DEV_RPG_API_URL}/health",
                            httpMode: 'GET',
                            contentType: 'APPLICATION_JSON',
                            timeout: 30,
                            validResponseCodes: '200'
                        )
                        
                        def health = readJSON text: response.content
                        echo "Dev-RPG Status: ${health.status}"
                        echo "Database: ${health.database}"
                        echo "Ollama: ${health.ollama}"
                        
                        if (health.status == 'critical') {
                            error("Dev-RPG platform is in critical state!")
                        }
                    } catch (Exception e) {
                        echo "Warning: Could not reach Dev-RPG platform: ${e.message}"
                        // Continue anyway - analysis might still work
                    }
                }
            }
        }
        
        stage('Collect Changed Files') {
            steps {
                script {
                    // Değişen dosyaları topla
                    env.CHANGED_FILES = sh(
                        script: '''
                            git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD
                        ''',
                        returnStdout: true
                    ).trim()
                    
                    echo "Changed files:\n${env.CHANGED_FILES}"
                }
            }
        }
        
        stage('Trigger Dev-RPG Analysis') {
            steps {
                script {
                    def changedFilesList = env.CHANGED_FILES.split('\n').findAll { it }
                    
                    def codeExtensions = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'cs']
                    def codeFiles = changedFilesList.findAll { file ->
                        def ext = file.tokenize('.').last()
                        codeExtensions.contains(ext)
                    }
                    
                    if (codeFiles.isEmpty()) {
                        echo "No code files changed, skipping analysis"
                        return
                    }
                    
                    echo "Analyzing ${codeFiles.size()} code files via Backend API..."
                    
                    def filesData = []
                    codeFiles.each { file ->
                        try {
                            def content = readFile(file: file)
                            def ext = file.tokenize('.').last()
                            def language = getLanguageFromExtension(ext)
                            
                            filesData.add([
                                file_path: file,
                                content: content,
                                language: language
                            ])
                        } catch (Exception e) {
                            echo "Could not read file ${file}: ${e.message}"
                        }
                    }
                    
                     def payload = [
                        commit_id: env.GIT_COMMIT_SHORT,
                        branch: env.GIT_BRANCH_NAME,
                        repository: env.GIT_URL ?: 'unknown',
                        author: env.GIT_AUTHOR,
                        message: env.GIT_COMMIT_MSG,
                        files: filesData,
                        timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                        project_id: env.PROJECT_ID
                    ]
                    
                    try {
                        def response = httpRequest(
                            url: "${DEV_RPG_API_URL}/api/webhook/jenkins",
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            requestBody: groovy.json.JsonOutput.toJson(payload),
                            timeout: 300,
                            validResponseCodes: '200:299'
                        )
                        
                        def jsonResponse = readJSON text: response.content
                        
                        
                        def result = jsonResponse.n8n_response
                        
                    
                        if (result instanceof List) {
                            if (result.size() > 0) {
                                result = result[0]
                            } else {
                                result = [:] 
                        }
                        
                        echo "Analysis linked to User ID: ${jsonResponse.user_linked}"

                        env.ANALYSIS_REPORT_ID = result.report_id ?: 'unknown'
                        env.OVERALL_SCORE = result.overall_score?.toString() ?: '0'
                        env.ANALYSIS_STATUS = result.status ?: 'unknown'
                        
                        echo """
                        ╔══════════════════════════════════════════════════════════════╗
                        ║                    DEV-RPG ANALYSIS REPORT                    ║
                        ╠══════════════════════════════════════════════════════════════╣
                        ║  Report ID: ${env.ANALYSIS_REPORT_ID}
                        ║  User: ${env.GIT_AUTHOR} (Auto-Registered)
                        ║  Overall Score: ${env.OVERALL_SCORE}/100
                        ║  Status: ${env.ANALYSIS_STATUS}
                        ║  
                        ║  Code Quality: ${result.code_quality?.score ?: 'N/A'}/100
                        ║  Architecture: ${result.architecture?.score ?: 'N/A'}/100
                        ║  Event Loop: ${result.event_loop?.score ?: 'N/A'}/100
                        ║  Efficiency: ${result.cost_analysis?.score ?: 'N/A'}/100
                        ║  
                        ║  XP Earned: ${result.rpg_summary?.xp_earned ?: 0}
                        ║  Badges: ${result.rpg_summary?.badges_earned?.join(', ') ?: 'None'}
                        ╚══════════════════════════════════════════════════════════════╝
                        """
                        
                        def threshold = env.QUALITY_THRESHOLD?.toInteger() ?: 50
                        if (env.OVERALL_SCORE.toInteger() < threshold) {
                            unstable("Code quality score (${env.OVERALL_SCORE}) is below threshold (${threshold})")
                        }
                        
                    } catch (Exception e) {
                        echo "Dev-RPG analysis failed: ${e.message}"
                        unstable("Could not complete Dev-RPG analysis")
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                echo "Building project..."
                // Projenize özgü build komutlarını buraya ekleyin
                // sh 'npm install && npm run build'
                // sh 'mvn clean package'
                // vb.
            }
        }
        
        stage('Test') {
            steps {
                echo "Running tests..."
                // Projenize özgü test komutlarını buraya ekleyin
                // sh 'npm test'
                // sh 'mvn test'
                // vb.
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying to production..."
                // Deploy komutlarınızı buraya ekleyin
            }
        }
    }
    
    post {
        success {
            script {
                echo "Pipeline completed successfully!"
                
                // Dev-RPG'ye başarı bildirimi gönder (opsiyonel)
                if (env.ANALYSIS_REPORT_ID && env.ANALYSIS_REPORT_ID != 'unknown') {
                    echo "View full analysis at: http://YOUR_SERVER_IP:3200/mission/${env.ANALYSIS_REPORT_ID}"
                }
            }
        }
        
        failure {
            echo "Pipeline failed!"
        }
        
        always {
            // Workspace temizliği
            cleanWs()
        }
    }
}

// Yardımcı fonksiyon: dosya uzantısından dil belirleme
def getLanguageFromExtension(String ext) {
    def languageMap = [
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'go': 'go',
        'rs': 'rust',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'scala': 'scala'
    ]
    return languageMap[ext] ?: ext
}
