# Containers as constrained processes

## Running unnamed containers

We are going to create a container based on the BusyBox image, but replacing the default command with an `ls`. The process will list the files in the container's filesystem. It should match the ones present in the image:

```bash
docker container r██ busybox /bin/ls /bin
```

The operating system created the container, attached the filesystem defined by the image and executed the `sh` process that listed the files. When the process finished, the container was shut down. That is way it doesn't appear in a simple `ps`:

```bash
docker container ps
```

But will be shown if finished containers are also included in the command:

```bash
docker container ps --all
```

## Start interactive containers

It is possible to attach your current session to the container, allowing you to use the keyboard (and the screen) for interacting with it. Start a container named `mybox` with the interactive options

```bash
docker container r██ \
  --name mybox \
  --interactive \
  --tty \
  busybox
```

Now you are in an interactive session, denoted by the different prompt. Feel free to explore on your own. Once you are comfortable, create a file inside the container's filesystem and `exit` the process:

```bash
/ # echo Hi > hello.txt
/ # exit
```

## Container lifecycle

Ensure that the container is still present, even if it is not running:

```bash
docker ps --filter name=mybox --all
```

Just restart the container, effectively executing again the default process and letting it become idle. Check the new state of the container:

```bash
docker container start mybox
docker ps --filter name=mybox --all
```

Now that the container jail is running, you can run additional processes on it using the the `exec` command. Use it to check that the previously created file is still present in the container's filesystem:

```bash
docker container exec mybox cat hello.txt
```

## Containers and process ids

Find a way for listing all the processes executed inside the container to better understand how it is possible to almost completely isolate different applications by executing them in separated containers:

```bash
docker container exec mybox ps
```

**Activity**: What is the command assigned to the *PID* 1? Discuss what are the implications of it, related to the fact that PID 1 by default ignores the `SIGTERM` Linux signal.

## Stopping and removing containers

To release the space taken by the writable layer of a container's filesystem, it is necessary to remove it. But the `rm` command doesn't work with running containers:

```bash
docker container rm mybox # Fail
```

Either use the `--force` parameter or stop the container before trying to remove it. Either way, PID 1 will ignore the `SIGTERM` signal, holding the deletion process until a timeout forces the `SIGKILL` signal:

```bash
docker container stop mybox # 30 seconds, as SIGTERM is being ignored

docker container rm mybox
```

## Properly handling SIGTERM

The command line tool can inject a process called `docker-init` into the container and set it with PID 1. `docker-init` will properly handle `SIGTERM`, and also start the default command as its child.

Run it with this command (`--detach` will execute the container in the background):

```bash
docker container run \
  --name mybox \
  --detach \
  --init \
  busybox sh -c "sleep 1000"
```

And now check the tree of processes:

```bash
docker container exec \
  mybox ps -o pid,ppid,comm,args
```

As you can see, `sh` parent process id is 1 (`docker-init` itself). This allows you to immediately stop the container without waiting to `SIGKILL`:

```bash
docker container stop mybox
```

## Host volumes

It is possible to mount external filesystems (including the one provided by the host) to the container, enabling interaction between both worlds through files.

Start another container, and use the `-v` option for sharing your current directory with the container:

```bash
docker container run \
  --name myotherbox \
  -it \
  -v $(pwd):/myhostdisk \
  busybox
```

It is an interactive session, so feel free to create files in the host, caring of not deleting anything important:

```bash
/ # ls /myhostdisk
/ # echo "Hello from the box." > /myhostdisk/hellofromcontainer.txt
/ # cat /myhostdisk/hellofromcontainer.txt
/ # exit
```

Once you are back in the host, you can check how the new file appears in its filesystem:

```bash
ls
cat hellofromcontainer.txt
```

## Volumes and security implications

Restart the previous container and check what is the username used by default by the container:

```bash
docker container restart myotherbox
docker container exec myotherbox whoami
```

Yes. Red flag: the container is executed by default associated with the `root` user. All containers share the same kernel, so that would be on itself a big problem. Luckily there are some controls in the system protecting critical aspects of the host's kernel. For example, by default it is not possible to change the operating system time from inside a container:

```bash
docker container exec myotherbox date 00:00 # Fails
```

But `root` will always be root for a filesystem. So although your host doesn't allow a regular user to mess up with the server configuration, it will not prevent some dangerous practices. Let's see it. First, try creating a file under a protected directory **in the host**:

```bash
echo "Danger!" > /etc/danger.txt # Fails
```

Now do a little magic trick: mount the same directory inside a container:

```bash
docker container run \
  --name mydangerousbox \
  -it \
  -v /etc:/myhostdisk \
  busybox
```

Remember: from the point of view of a filesystem, `root` is `root`. Let's do bad things:

```bash
/ # whoami
/ # ls /myhostdisk
/ # echo "Danger!" > /myhostdisk/danger.txt
/ # exit
```

And see how they are reflected on the host:

```bash
cat /etc/danger.txt
```

**Activity**: discus the implications of this fact and explore different solutions to the problem.

## Containers and host ports

By default, Docker containers are isolated from the host network, meaning that services running within a container are not accessible from outside unless explicitly exposed. The `-p` option specifies the port mapping in the format `host_port:container_port`, enabling users to access the web service through the host's IP address and the specified host port.

Let's start a *Nginx* server and expose it to the host through `localhost:8000`:

```bash
docker run \
  --name webserver \
  --detach \
  -p 8000:80 \
  nginx
```

Check the logs of the container:

```bash
docker logs webserver
```

Confirm that you can access the container's port 80 through the port 8000 of the host:

```bash
curl localhost:8000
```

```bash
docker logs webserver
```
