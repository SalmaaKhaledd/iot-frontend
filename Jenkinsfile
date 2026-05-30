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

        stage('Docker Build') {
            steps {
                sh 'docker build --no-cache -t $DOCKER_IMAGE:$IMAGE_TAG .'

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
                withCredentials([
                    string(credentialsId: 'db-password', variable: 'DB_PASS'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')
                ]) {
                    sh """
                        mkdir -p "\$WORKSPACE/iot-devops/secrets"
                        printf '%s' "\$DB_PASS" > "\$WORKSPACE/iot-devops/secrets/db_password.txt"
                        printf '%s' "\$JWT_SECRET" > "\$WORKSPACE/iot-devops/secrets/jwt_secret.txt"
                        SECRETS_PATH="\${HOST_WORKSPACE_ROOT}/\${JOB_NAME}/iot-devops/secrets" \
                        docker-compose -f iot-devops/docker-compose.yml up -d --pull always
                    """
                }
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
