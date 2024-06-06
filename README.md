# Serverok

<p align="center">
  <a href="https://github.com/vinceloppeur/serverok/blob/main/README.md"><img src="docs/Serverok.png" width="250px" alt="serverok logo" /></a>
</p>

<p align="center">
  <img alt="language typescript" src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square" />
  <img alt="license MIT" src="https://img.shields.io/badge/license-MIT-blue" />
  <img alt="package.json version" src="https://img.shields.io/github/package-json/v/vinceloppeur/serverok" />
</p>

Serve your files/folders locally or over a network.

## How Does It Work?

It uses [ngrok-javascript](https://www.npmjs.com/package/@ngrok/ngrok) to create a tunnel to your localhost.

There will be an interface where you can choose which file/folder you want to share.

A `.zip` file will be created when you want to share a folder instead of a file so you don't have to compress it beforehand (_although it is recommended for you to just zip it yourself_)

## Install

```bash
npm install -g serverok
```

## Authentication


```bash
serverok auth --token [your_auth_token]
```

_To get your auth token, first [create and login to your ngrok account](https://dashboard.ngrok.com/login)_

Without passing the `--token` option, a prompt will be created to enter your auth token.

## Serve Your Files

```bash
serverok serve [path]
```

You can also pass these options, for example:

```bash
serverok serve <path> --port [number] --interface-port [number]
```

- _--port_ : the port that will be forwarded and used to download your file. (_default: 3004_)
- _--interface-port_ : the port that will be used for the interface. (_default: 3000_)

## Preview

![interface preview](/docs/gifs/Recording%202024-06-06%20143414.gif)

## Usage

For more information about the commands

```bash
serverok help
```

---

<p align="center">
  <a href="https://www.youtube.com/channel/UCvO8ylE3kFkAd6DKe12cmgg"><img alt="Youtube channel logo" src="https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white)" /></a>
  <a href="https://medium.com/@vinceloppeur"><img alt="Medium Blog logo" src="https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white" /></a>
  <a href="https://dev.to/vinceloppeur"><img alt="Dev.to Blog logo" src="https://img.shields.io/badge/dev.to-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white" /></a>
</p>
<p align="center">
  <a href="https://github.com/vinceloppeur"><img alt="Github logo" src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" /></a>
</p>
