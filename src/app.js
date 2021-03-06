
import Koa from 'koa'
import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import responseFilter from './middleware/responseFilter'
import tokenVerify from './middleware/tokenVerify'
import user from './router/user'
import file from './router/upload'
import article from './router/article'
const app = new Koa()
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())

app.use(responseFilter())
app.use(tokenVerify)

app.use(user.routes()).use(user.allowedMethods())
app.use(file.routes()).use(file.allowedMethods())
app.use(article.routes()).use(article.allowedMethods())


// logger
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
// })

// routes

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
