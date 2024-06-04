# Serverok

Serve your files/folders locally or over a network.

## How Does It Work?

It uses [ngrok-javascript](https://www.npmjs.com/package/@ngrok/ngrok) to create a tunnel to your localhost.

An interface will be created where you can choose which file/folder you want to share.

A `.zip` file will be created when you want to share a folder instead of a file so you don't have to compress it beforehand.

## Install

```bash
npm install -g serverok
```

## Authentication

_Before you can use this, you must first have an [ngrok](https://ngrok.com) account and get your auth token._

```bash
serverok auth --token [your_auth_token]
```

Or you can just run the command without passing any options and it will prompt you to enter your auth token.

## Serve Your Files

```bash
serverok serve [path]
```

This will create an interface where you will be able to choose which files/folders to share.

You can also pass port options to this command, for example:

```bash
serverok serve [path] --port [number] --interface-port [number]
```

- _--port_ : the port that will be be tunneled and used to download files. (_default: 3004_)
- _--interface-port_ : the port that will be used for the interface. (_default: 3000_)

## Usage

For more information about the commands

```bash
serverok help
```
