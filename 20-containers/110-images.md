# Containers: Images

## What is BusyBox?

BusyBox is a software suite that consolidates a variety of Unix utilities into a single executable file. This multi-call binary provides minimalist replacements for many common commands found in larger Unix-like systems, such as those in `GNU coreutils` and `util-linux`, and can be used to create a highly functional Linux distribution with a very light footprint.

There is a container image that emulates `bash` based on that tool. It is very compact, and we can use it for exploring this technology.

## What is a Registry?

An image registry is a database for images, with a well-defined HTTP API. It is a very convenient way of distributing artifacts, as every image corresponds to an application. All the versions of a particular application (image) share the same name and together form what is called a repository. Each specific version is identified by its hash code, but it is most commonly referred to by arbitrary tags, as they are better suited for humans.

[Docker Hub](https://hub.docker.com/) and [Quay](https://quay.io) are popular public image registries that also provide private support. [Azure Container Registry](https://azure.microsoft.com/es-es/products/container-registry) is a managed private registry product offered by Azure.


**Activity**: Use [Docker Hub's search to look for BusyBox images](https://hub.docker.com/search?q=busybox) and explore the repository of the official one. Answer the following questions:

* What is the hash code of the latest stable version based on *musl* on x86?
* What are the tags associated to it?
* Which size has this image?

Access the search function using the command line:

```bash
docker search busybox --limit 5
```

Limit the search to the official one. Be careful, as the *official* image does not come with any special guarantee of quality.

```bash
docker search busybox --filter is-official=true
```

**Activity**: using either method, find images for three relevant software products and take
not of their names.

Getting all the tags that a repository contains is not straightforward using the command line tool, but can be achieved by directly invoking the REST API:

```bash
wget -q -O - \
  "https://hub.docker.com/v2/namespaces/library/repositories/busybox/tags?page_size=100" \
  | grep -o '"name": *"[^"]*' \
  | grep -o '[^"]*$' \
  | less
```

## Downloading images

Install the [jq](https://jqlang.github.io/jq/) command. It will help us managing the *json* output of several commands:

```bash
sudo apt install -y jq
```

Use the appropriate command for downloading the image tagged as `latest` from the default repository (Docker Hub).

```bash
docker image p███ busybox
```

Check the list of images in the local repository:

```bash
docker image l███
```

## Image distribution format

Now that the image is in a local repository, you can export it to a *tar* file:

```bash
docker image s███ busybox | gzip > busybox.tar.gz
```

And uncompress the file in a regular directory:

```bash
mkdir -p ./temp/busybox/
tar -xvf busybox.tar.gz -C ./temp/busybox
```

Take your time for exploring the created structure, with particular attention to the metadata files:

```bash
ls temp/busybox

cat temp/busybox/index.json | jq

cat temp/busybox/manifest.json | jq
```

The `manifest.json` file is particularly interesting, as it contains a reference to the disk structure of the image and the bootstrapping configuration:

```bash
CONFIG=$(cat temp/busybox/manifest.json | jq .[0].Config -r)
echo The configuration for this image is in $CONFIG.
```

Let's read that file:

```bash
cat temp/busybox/$CONFIG
```

As you can see, a container based on this image will launch a `sh` process, as explicits the `.config.Cmd` property.

Our goal now is to explore the filesystem that will be presented to the process inside the container. For that, we take note of the initial layer that contains the files that compose the disk:

```bash
ROOTFS=$(cat temp/busybox/$CONFIG | jq .rootfs.diff_ids[0] -r)
echo The content of the container filesystem is in $ROOTFS.
```

It is a simple `tar` file, so we can use that command to look inside:

```bash
tar tvf temp/busybox/blobs/sha256/${ROOTFS:7} | grep "bin/"
```

As you can see, most of the files are *symblinks* to the `[` command (which is the weird name of the BusyBox executable).
