pipeline {
    agent any

    environment {
        // Define any global environment variables here
        NODE_ENV = "production"
    }

    stages {
        stage('Checkout') {
            steps {
                // Check out the code from the repository
                checkout scm
            }
        }

        stage('Install & Build Backend') {
            steps {
                dir('server') {
                    echo 'Installing backend dependencies...'
                    sh 'npm install'

                    echo 'Running backend tests...'
                    // Uncomment the following line if you have tests set up
                    // sh 'npm test'

                    echo 'Building backend (if applicable)...'
                    // Uncomment if you have a build step for the backend (e.g., TypeScript compilation)
                    // sh 'npm run build'
                }
            }
        }

        stage('Install & Build Frontend') {
            steps {
                dir('client') {
                    echo 'Installing frontend dependencies...'
                    sh 'npm install'

                    echo 'Running frontend tests...'
                    // Uncomment the following line if you have tests set up
                    // sh 'npm test'

                    echo 'Building frontend...'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Push') {
            when {
                expression { return env.BRANCH_NAME == 'main' }
            }
            steps {
                script {
                    echo 'Building Docker images for backend and frontend...'

                    // Build backend image
                    dir('server') {
                        sh 'docker build -t lumina-backend:latest .'
                    }

                    // Build frontend image
                    dir('client') {
                        sh 'docker build -t lumina-frontend:latest .'
                    }

                    // Optionally, push Docker images to your registry
                    // sh 'docker push your-registry/lumina-backend:latest'
                    // sh 'docker push your-registry/lumina-frontend:latest'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs for errors.'
        }
        always {
            // Clean up workspace, stop services, etc.
            cleanWs()
        }
    }
}
