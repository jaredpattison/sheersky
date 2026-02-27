import {type Express} from 'express'

import {type AppContext} from '../context.js'

export default function (ctx: AppContext, app: Express) {
  return app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: '8U43G9PFFY.com.sheersky.app',
            paths: ['*'],
          },
        ],
      },
      appclips: {
        apps: ['8U43G9PFFY.com.sheersky.app.AppClip'],
      },
    })
  })
}
