import Promise from 'bluebird'
import uuid from 'uuid'
import utils from 'utility'
import User from '../model/user'
import UserInfo from '../model/userinfo'
import ApiError from '../error/ApiError'
import ApiErrorNames from '../error/ApiErrorNames'
import * as regex from '../config/regex'
import { secret } from '../config/index'
import * as jwt from 'jsonwebtoken'
const verify = Promise.promisify(jwt.verify)
const filter = { 'userPass': 0, '__v': 0, '_id': 0 }

class UserController {

  static async getAllUser(ctx) {
    ctx.body = await User.find({}, filter)
  }

  // 用户登录 账号密码登陆
  static async loginUser(ctx) {
    let { userName, userPass } = ctx.request.body
    if (!userName) {
      throw new ApiError(ApiErrorNames.UserNameNotNull);
    }
    if (!regex.emailCheck.test(userName)) {
      throw new ApiError(ApiErrorNames.UserEmailInvalid)
    }

    let hasUser = await User.findOne({ userName: userName })
    if (!hasUser) {
      throw new ApiError(ApiErrorNames.UserNotExist);
    }

    await loginHanlde(ctx, userName, userPass)
  }

  // 用户登陆 token登陆
  static async userTokenLogin(ctx) {
    let token = ctx.request.headers['authorization']
    let payload = await verify(token, secret)
    let { userName } = payload
    let _user = await User.findOne({ userName: userName })
    let _token = getUserToken(userName)
    ctx.body = {
      user: _user,
      token: _token
    }
  }

  // 用户注册
  static async saveUser(ctx) {
    let { userName, userPass } = ctx.request.body
    if (!userName) {
      throw new ApiError(ApiErrorNames.UserNameNotNull);
    }
    if (!regex.emailCheck.test(userName)) {
      throw new ApiError(ApiErrorNames.UserEmailInvalid)
    }

    if (userPass.length < 6) {
      throw new ApiError(ApiErrorNames.UserPassMinLength)
    }

    if (userPass.length > 12) {
      throw new ApiError(ApiErrorNames.UserPassMaxLength)
    }

    let selectuser = await User.findOne({ userName: userName })
    if (selectuser) {
      throw new ApiError(ApiErrorNames.UserIsExist);
    } else {
      // 初始化当前用户信息 相信内容表，并关联用户表
      let _info = new UserInfo()
      await _info.save(err => {
        if (err) throw new ApiError();
      })
      let user = new User({
        userName: userName || admin,
        userPass: md5Pwd(userPass),
        userid: uuid.v1(),
        userInfo: _info._id
      });
      await user.save();
      await loginHanlde(ctx, userName, userPass)
    }
  }

  static async removeUser(ctx) {
    User.remove({}, (e, d) => {
      ctx.body = {}
    })
  }
}

function getUserToken(userName) {
  let payload = { userName: userName, time: new Date().getTime(), timeout: 10000 }
  let token = jwt.sign(payload, secret);
  return token
}

async function loginHanlde(ctx, userName, userPass) {
  let user = await User.findOne({ userName: userName, userPass: md5Pwd(userPass) }, filter).populate('userInfo', filter)
  if (!user) {
    throw new ApiError(ApiErrorNames.UserPassInvalid);
  }
  let _token = getUserToken(userName)
  return ctx.body = {
    user: user,
    token: _token
  }
}

function md5Pwd(pwd) {
  const salt = 'gold_like_popup@mid!POS##'
  return utils.md5(utils.md5(pwd + salt))
}

export default UserController;
