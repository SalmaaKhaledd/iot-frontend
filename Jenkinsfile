pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "salmakhaledabdou/iot-frontend"
        IMAGE_TAG    = "v3.0"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:$IMAGE_TAG .'
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                    sh 'docker push $DOCKER_IMAGE:$IMAGE_TAG'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('iot-devops') {
                    git url: 'https://github.com/faridakhaled05/iot-devops.git',
                        branch: 'main'
                }
                sh 'docker compose -f iot-devops/docker-compose.yml up -d --pull always'
            }
        }
    }

    post {
        success {
            echo 'Frontend pipeline completed successfully.'
        }
        failure {
            echo 'Frontend pipeline failed. Check stage logs.'
        }
    }
}
