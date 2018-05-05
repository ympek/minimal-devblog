// ympek's minimal-devblog
// static site generator
// TODO layout powinien sie cache'owac
// TODO timestamps

const fs = require("fs");
const showdown = require("showdown");
const ejs = require("ejs");

const { promisify } = require("util");
const readdir   = promisify(fs.readdir);
const readFile  = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const cfg = require("./config.json");

readdir(cfg.pathToPosts)
  .then(posts => {
    posts.forEach(filename => {
      generateStaticPage(filename);
    });

    generateIndex(posts.map(filename => filename.replace(".md", ".html")));
  }).catch(err => {
    // no posts folder.
    console.log("Error: " + err);
  });

function generateHtmlFromMarkdown(content) {
  return new showdown.Converter().makeHtml(content);
}

function loadLayoutHtml() {
  return readFile(cfg.pathToPostTemplate, "utf-8");
}

function loadIndexHtml() {
  return readFile(cfg.pathToIndexTemplate, "utf-8");
}

function loadContentMarkdown(path) {
  return readFile(path, "utf-8");
}

function mergeContentWithLayout(content, layout)
{
  const renderedHtml = ejs.render(layout, {
    username: cfg.username,
    content: generateHtmlFromMarkdown(content)
  });

  return new Promise(resolve => {
    resolve(renderedHtml);
  });
}

function buildOutputHtml(filename) {
  return Promise.all([
    loadContentMarkdown(cfg.pathToPosts + filename),
    loadLayoutHtml()
  ])
    .then(parts => mergeContentWithLayout(parts[0], parts[1]))
    .catch(err => {
      console.log("Failed. Error message: " + err);
    });
}

function generateStaticPage(filename)
{
  buildOutputHtml(filename).then(html => {
    const outputFile = cfg.outputHtmlPath + filename.replace(".md", ".html");
    console.log("Saving: " + outputFile);
    return writeFile(outputFile, html);
  })
    .then(() => console.log("Success!"))
    .catch(err => console.log("Error!!!" + err));
}

function generateIndex(posts)
{
  console.log("Creating index page...");
  loadIndexHtml()
    .then(idx => {

      const renderedHtml = ejs.render(idx, {
        username: cfg.username,
        posts: posts,
      });

      return new Promise(resolve => {
        resolve(renderedHtml)
      });
    })
    .then(renderedHtml => {
      const outputFile = cfg.outputHtmlPath + "index.html";
      return writeFile(outputFile, renderedHtml);
    });
}
