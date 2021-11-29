# Netshot Kubernetes Deployment V0.1
Deploy Custom Netshot Image to Kubernetes

## How to start

* Gather the name of your Kubernetes storage
    * Replace storage variables in the postgres and postgresVolumeClaim yaml files
* Deploy postgresVolumeClaim.yaml first
* Deploy postgres.yaml second 
    * This is a stateful set deployment for Postgres offering some redundancy.
    * Verify Postgres is running by using kubectl get pods
* Deploy netshot.yaml
    * You must run the docker build netshot commands to build the netshot image
    * After you build the image you must store it in dockerhub or internal image repo.
* This deploys to a kubernetes namespace with the name netshot
* We could create a docker image and host it on dockerhub that could be used for this