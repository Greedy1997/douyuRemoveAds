// ==UserScript==
// @name         斗鱼去火箭横幅(贵族弹幕样式&&聊天区域铭牌)
// @namespace    https://github.com/wah0713/myTampermonkey
// @version      2.02
// @description  一个兴趣使然的脚本，本来只是屏蔽火箭横幅的脚本，到后来。。。 【✅功能按钮】 默认最高画质、弹幕悬停、竞猜显示、抽奖显示、背景显示、礼物栏简化、聊天框简化、禁言消息显示、聊天框用户铭牌显示、显示房间数据（人数、消费、时常）。 【✅默认设置】左侧展开默认收起、弹幕简化（贵族弹幕）、聊天框消息简化（大部分系统消息）【✅屏蔽】屏蔽内容过多，这里就不展开了....
// @supportURL   https://github.com/wah0713/myTampermonkey/issues
// @author       wah0713
// @compatible   chrome
// @license      MIT
// @icon         https://www.douyu.com/favicon.ico
// @require      https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @match        http*://www.douyu.com/*
// @connect      doseeing.com
// @noframes     true
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  if (!/^\/\d+$/.test(window.location.pathname) && window.location.pathname.indexOf('topic') === -1) return false

  // 版本号
  const version = '2.02'
  // 更新说明
  const updateNotes = version + `：<br />
        1、[显示房间数据]上线。实话实说我本来是抗拒的，因为这个功能需要获取用户更多权限。<br />数据来源doseeing.com(感谢) 由 BerryBarry11 提出<br />
        2、[默认最高画质]修复且重新上线 <br />
        3、多弹幕情况下会卡顿（现在有所好转，但还在持续观察） 由 Jesse1uo 提出<br />
        `
  // 房间id
  const rid = getRoomId()
  // layoutMain的初始MarginTop
  let originalLayoutMainMarginTop = null
  // layoutMain的初始OffsetTop
  let originalayoutMainOffsetTop = null
  let sign = 0
  // Background-holder的原始paddingTop值
  let InitiaGuessGameHeight = 0
  // 计时器
  let adjustClarityTimer = null
  let showRoomDataTimeout = null
  let showRoomDataInterval = null

  // 只执行一次
  const once = {
    backgroundIsShow: true,
    InitiaGuessGameHeight: true,
  }

  function getRoomId() {
    try {
      return $('.Title-anchorLink').attr('href').replace(/,/g, '').match(/\d+$/g)[0]
    } catch (error) {
      return unsafeWindow.rid || unsafeWindow.apm_room_id || null
    }
  }
  $('body').append(`<div id='wah0713-alert'><i></i><span></span></div>`)

  /**
   *  提示框
   * @param {string} message 内容
   * @param {string} type 类型
   * @param {number} time 延迟时间
   * @param {dom} dom 控制的dom
   */
  function myAlert(params) {
    $('#wah0713-alert >span').html(params.message).parent('#wah0713-alert')
    if (params.type === 'warning') {
      $('#wah0713-alert').show()
      setTimeout(() => {
        $('#wah0713-alert').hide()
      }, params.time * 1000)
      $('#wah0713-alert').removeClass().addClass('warning').children('i').text('x')
    } else if (params.type === 'info') {
      $('#wah0713-alert').removeClass().addClass('info').children('i').text('i')
      params.dom.mouseleave(() => {
        $('#wah0713-alert').hide()
      })
      params.dom.mouseenter(() => {
        // 提示用户更新内容
        GM_setValue(version, true)
        $('#wah0713-alert').show()
      })
    }
  }

  // 右侧自定义按钮模块
  $('body').append(`
        <div id="wah0713">
            <div class="gear"><img src="https://img-blog.csdnimg.cn/20210116195614388.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2MyODY4OTgyMzI=,size_16,color_FFFFFF,t_70#pic_centerg">
                <div class="redDot"></div>
            </div>
        </div>
        `)
  $('#wah0713').mouseenter(() => {
    $('#wah0713 .gear').fadeOut("slow")
    myAlert({
      message: updateNotes,
      type: 'info',
      dom: $('#wah0713 >.tip')
    })
  }).mouseleave(() => {
    $('#wah0713 .gear').fadeIn("slow")
  })

  // 版本号和提示语
  $("#wah0713").append(`<p class='tip'>${version}版本（更新内容详情）</p>`)
  /**
   *  封装按钮显示事件
   * @param {string} localStorageName 按钮本地存储名
   * @param {string} displayName 按钮显示名
   */
  function btnListFun(localStorageName, displayName, description) {
    $("#wah0713").append(`<button class='${localStorageName}' title='${description}'>${displayName}(close)</button>`)

    function btnInit() {
      if (!config[localStorageName]) {
        $(`#wah0713 .${localStorageName}`).addClass('close').text(`${displayName}(close)`)
      } else {
        $(`#wah0713 .${localStorageName}`).removeClass('close').text(`${displayName}(open)`)
      }
    }
    btnInit()
    $(`#wah0713 .${localStorageName}`).click(() => {
      const value = !config[localStorageName]
      config[localStorageName] = value
      GM_setValue(localStorageName, value)
      btnInit()
      if (typeof (once[localStorageName]) !== 'undefined') {
        once[localStorageName] = true
      }
    })
  }

  // 用户默认配置
  const defaultConfig = {
    adjustClarity: {
      name: '默认最高画质',
      description: '10秒后开启当前房间最高画质，可能会闪一次屏__本功能由noob-one提出',
      value: false,
      action: (value) => {
        clearTimeout(adjustClarityTimer)
        if (!value) return false
        adjustClarityTimer = setTimeout(() => {
          if ($('.adjustClarity')[0].style.display !== 'none' && value) {
            let ul = $('.c5-6a3710[value="画质 "]~ul')
            let firstChild = $('.c5-6a3710[value="画质 "]~ul li:first-child')
            if (ul && !firstChild.hasClass('selected-3a8039')) {
              firstChild.click()
            }
            ul = null
            firstChild = null
          }
        }, 10 * 1000)
      }
    },
    danmuMove: {
      name: '弹幕悬停',
      description: '播放器内弹幕被选中时悬停__本功能由noob-one提出',
      value: false,
    },
    guessIsShow: {
      name: '竞猜显示',
      description: '竞猜是否显示__本功能由noob-one提出',
      value: false,
    },
    lotteryIsShow: {
      name: '抽奖显示',
      description: '抽奖是否显示__本功能由lv88ff提出',
      value: false,
    },
    backgroundIsShow: {
      name: '背景显示',
      description: '背景是否显示__本功能由dongliang zhang提出',
      value: false,
    },
    playerBottomSimplification: {
      name: '礼物栏简化',
      description: '播放器下方礼物栏简化__本功能由evenora提出',
      value: true,
    },
    chatBoxCleaning: {
      name: '聊天框简化',
      description: '聊天框头部去除主播公告、贡献周榜、贵宾、粉丝团和主播通知__本功能由dongliang zhang提出',
      value: true,
    },
    forbiddenMessage: {
      name: '禁言消息显示',
      description: '聊天框内用户被禁言消息是否显示__本功能由lv88ff提出',
      value: false,
    },
    isShowNickName: {
      name: '用户铭牌显示',
      description: '聊天框用户铭牌显示是否显示__本功能由W.ast和BerryBarry11提出',
      value: false,
      action: async (value) => {
        // 聊天框用户铭牌
        const p = () => (new Promise((resolve) => {
          setTimeout(() => {
            if ($('.Barrage-list').length === 0) {
              resolve(false)
            } else {
              resolve(true)
            }
          }, 200)
        }))

        const time = async () => {
          if (!await p()) {
            return await time()
          } else {
            return true
          }
        }
        await time()

        if (!value) {
          $('.Barrage-list').addClass('trim')
        } else {
          $('.Barrage-list').removeClass('trim')
        }
      }
    },
    isShowRoomData: {
      name: '显示房间数据',
      description: '10秒后显示房间数据（时间范围今天00:00到今晚24:00）,12分钟刷新数据一次__本功能由BerryBarry11提出',
      value: true,
      action: (value) => {
        if (value) {
          showRoomDataTimeout = setTimeout(ShowRoomData, 10 * 1000)
          showRoomDataInterval = setInterval(ShowRoomData, 60 * 12 * 1000)
        } else {
          hideRoomData()
          clearTimeout(showRoomDataTimeout)
          clearInterval(showRoomDataInterval)
        }
      }
    }
  }

  const config = new Proxy({}, {
    // get: function (target, propKey, receiver) {
    //   console.log(`getting ${propKey}!`);
    //   return Reflect.get(target, propKey, receiver);
    // },
    set: function (target, propKey, value, receiver) {
      defaultConfig[propKey].action && defaultConfig[propKey].action(value)
      return Reflect.set(target, propKey, value, receiver);
    }
  })

  for (let key in defaultConfig) {
    const {
      name,
      description,
      value
    } = defaultConfig[key]
    config[key] = GM_getValue(key, value)
    // 按钮事件
    btnListFun(key, name, description)
  }

  // 左侧展开默认收起
  if ($(".Aside-main--shrink").width() > 100) {
    $(".Aside-toggle").click()
  }

  // 头部隐藏
  let headIsHideTimer = null
  let headIsShowTimer = null
  $('body').addClass('head-hide')
  $('#js-header').mouseenter(() => {
    clearTimeout(headIsHideTimer)
    headIsShowTimer = setTimeout(() => {
      $('body').removeClass('head-hide')
      $('.public-DropMenu-drop').each((idx, dom) => {
        dom.style = ""
      })
    }, 500)
  })
  $('#js-header').mouseleave(() => {
    clearTimeout(headIsShowTimer)
    headIsHideTimer = setTimeout(() => {
      $('body').addClass('head-hide')
      $('.public-DropMenu-drop').hide()
      $('.Search-text').blur()
    }, 5 * 1000)
  })

  // 提示用户更新了
  if (GM_getValue(version, false)) {
    $('#wah0713').removeClass('hasUpdate')
  } else {
    $('#wah0713').addClass('hasUpdate')
  }

  let body = $('body')[0]
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver

  const observer = new MutationObserver(function () {

    // 获取初始竞猜高度
    if (once.InitiaGuessGameHeight && $('.Bottom-guessGame-placeholder').length) {
      InitiaGuessGameHeight = $('.Bottom-guessGame-placeholder').height()
      once.InitiaGuessGameHeight = false
    }

    // 自定义按钮显示条件
    if ($('.UnLogin').length) {
      $('.adjustClarity').hide()
      $('.danmuMove').hide()
    } else {
      $('.adjustClarity').show()
      $('.danmuMove').show()
    }

    // 抽奖显示
    if (config.lotteryIsShow) {
      // 抽奖中间部提示框、
      $(".LotteryContainer").show()
      // 抽奖(播放器左下角)、
      $(".UPlayerLotteryEnter").removeClass('is-hide')
      // 中奖播放器中显示
      $(".LotteryContainer-svgaWrap").show()
      // 粉丝福利社抽奖
      $('.LotteryDrawEnter').show()

    } else {
      // 抽奖中间部提示框、
      $(".LotteryContainer").hide()
      // 抽奖(播放器左下角)、
      $(".UPlayerLotteryEnter").addClass('is-hide')
      // 中奖播放器中显示
      $(".LotteryContainer-svgaWrap").hide()
      // 粉丝福利社抽奖
      $('.LotteryDrawEnter').hide()
    }

    // 屏蔽播放器内大多活动
    $('.player-dialog').children().each((index, dom) => {
      if (config.lotteryIsShow) {
        if (!$(dom).find('.LotteryContainer').length) {
          $(dom).hide()
        } else {
          $(dom).show()
        }
      } else {
        $(dom).hide()
      }
    })


    if (config.playerBottomSimplification) {
      $('.ActivityItem').removeClass('is-hide')
      if (!config.guessIsShow) {
        $('.ActiviesExpanel').addClass('is-hide')
      } else {
        $('.ActiviesExpanel').removeClass('is-hide')
        $('.ActiviesExpandPanel').css({
          width: 'auto',
          'margin-left': '0',
        })
      }
      $('.ActivityItem:not(.ActivityItem[data-flag="room_level"]):not(.ActivityItem[data-flag="anchor_quiz"])').addClass('is-hide')
      $('.PlayerToolbar-Task').addClass('is-hide')
      $('.ActCenterPkEntry').addClass('is-hide')
      $('.PartyEntry').addClass('is-hide')
      $('.ToolbarActivityArea>div:last-child>div>div:not(.LotteryDrawEnter)').addClass('is-hide')
    } else {
      $('.ActivityItem').removeClass('is-hide')
      $('.ActiviesExpanel').removeClass('is-hide')
      $('.PlayerToolbar-Task').removeClass('is-hide')
      $('.ActCenterPkEntry').removeClass('is-hide')
      $('.PartyEntry').removeClass('is-hide')
      $('.ToolbarActivityArea>div:last-child>div>div:not(.LotteryDrawEnter)').removeClass('is-hide')
    }

    // 主播公告、贡献周榜、贵宾和粉丝团
    if (config.chatBoxCleaning) {
      $(".layout-Player-asideMainTop").addClass("hide")
    } else {
      $(".layout-Player-asideMainTop").removeClass("hide")
    }


    // 弹幕悬停关闭
    if ($('.danmuMove')[0].style.display !== 'none' && config.danmuMove) {
      $('.room-Player-Box').removeClass('mark')
    } else {
      $('.room-Player-Box').addClass('mark')
    }

    // 竞猜显示
    if (config.guessIsShow) {
      // 聊天框用户竞猜获奖
      $('.Barrage-list .Barrage-guess').parent('.Barrage-listItem').show()
      $('.ActivityItem[data-flag="anchor_quiz"]').show()
      $('.GuessGameMiniPanelB-wrapper').show()
      $('.guessGameContainer').show()
      $('.Bottom-guessGame-placeholder').height(InitiaGuessGameHeight)
    } else {
      // 聊天框用户竞猜获奖
      $('.Barrage-list .Barrage-guess').parent('.Barrage-listItem').hide()
      $('.ActivityItem[data-flag="anchor_quiz"]').hide()
      $('.GuessGameMiniPanelB-wrapper').hide()
      $('.guessGameContainer').hide()
      $('.Bottom-guessGame-placeholder').height(0)
    }

    // 背景图
    let $layoutMain = $('.layout-Main')
    if (config.backgroundIsShow && !$('.is-fullScreenPage').length) {
      if (once.backgroundIsShow) {
        $('html').removeClass('no-background')
        // 恢复除播放器以外的多余bc-wrapper元素
        $('.bc-wrapper').show()

        $('.wm-general').show().removeClass('marginTop100')

        $('.wm-general-bgblur').removeClass('background-image-hide')

        $layoutMain[0].style = ""
        setTimeout(() => {
          window.scrollTo(0, $('.layout-Player').offset().top - 100)
        }, 200)
        once.backgroundIsShow = false
      }
    } else if (!$('.is-fullScreenPage').length) {
      $('html').addClass('no-background')
      // 暴雪频道特有
      if (originalayoutMainOffsetTop && (originalayoutMainOffsetTop > $(window).height() * 1 / 2)) {
        $('body').addClass('go-beyound')
      } else {
        $('body').removeClass('go-beyound')
      }

      !originalLayoutMainMarginTop && (originalLayoutMainMarginTop = $layoutMain.css('margin-top').split('px')[0] - 0)
      if (once.backgroundIsShow) {
        setTimeout(() => {
          originalayoutMainOffsetTop = $layoutMain.offset().top
          if (originalayoutMainOffsetTop < 70) {
            const gaps = 70 - originalayoutMainOffsetTop
            $layoutMain.css('margin-top', originalLayoutMainMarginTop + gaps)
          } else {
            $layoutMain[0].style = ""
          }
          window.scrollTo(0, $('.layout-Player').offset().top - 100)
        }, 200)
        once.backgroundIsShow = false
      }

      // 去掉除播放器以外的多余bc-wrapper元素
      $('.bc-wrapper').each((index, element) => {
        $(element).children().each((idx, ele) => {
          if ($(ele).hasClass('layout-Main')) {
            sign = index
            return false
          }
        })
      })

      $('.wm-general').each((idx, dom) => {
        if ($(dom).find('div.layout-Main').length) {
          $(dom).addClass('marginTop100')
        } else {
          $(dom).hide()
        }
      })
      $('.wm-general-bgblur').addClass('background-image-hide')

      $('.bc-wrapper').not($('.bc-wrapper')[sign]).hide()
    }

    // 输入框上方送礼3000毫米淡出
    $('#js-player-barrage .BarrageBanner').children().delay(1000 * 3).fadeOut('slow')

    // 聊天框用户点赞 （parents多个s）
    $('.Barrage-list .roomDianzanIcon').parents('.Barrage-listItem').hide()

    // 聊天框用户相关消息广播
    // 系统提示（例如禁言）Barrage-notice--red
    $('.Barrage-list .Barrage-icon--sys').each((idx, dom) => {
      let domParent = $(dom).parent('.Barrage-listItem')
      if (config.forbiddenMessage) {
        if (domParent.find('.Barrage-text').text().indexOf("禁言") === -1) {
          domParent.hide()
        } else {
          domParent.show()
        }
      } else {
        domParent.hide()
      }
      domParent = null
    })

  })
  const observerConfig = {
    subtree: true,
    childList: true,
  }
  observer.observe(body, observerConfig)
  body = null

  // 获取房间数据
  function getRoomData(rid) {
    return new Promise(resolve => {
      //  rids房间号
      //  dt 统计周期 0（今天） 1（昨天） 7（7天内 ） 30（30天）thismonth（本月）
      //  rank_type chat_pv 聊天和点击量
      GM_xmlhttpRequest({
        url: `https://www.doseeing.com/data/api/rank?rids=${rid}&dt=0&rank_type=chat_pv`,
        method: 'GET',
        Headers: {
          Host: 'www.doseeing.com',
          Referer: `https://www.doseeing.com/data/room/${rid}?type=overview&dt=0`,
        },
        responseType: "json",
        onload: function (res) {
          // 这里不能格式化res?.response?.result?.result[0]
          // resolve(res?.response?.result?.result[0]);
          resolve(eval('res?.response?.result?.result[0]'));
        }
      })
    })
  }
  // 显示房间数据
  async function ShowRoomData() {
    const data = await getRoomData(rid)
    if (!data) return false
    const {
      // 总礼物价值
      "gift.all.price": giftAllPrice,
      // 总礼物送礼人数
      "gift.all.uv": giftAllUv,
      // 总付费礼物
      "gift.paid.price": giftPaidPrice,
      // 总付费送礼人数
      "gift.paid.uv": giftPaidUv,
      // 总弹幕数
      "chat.pv": chatPv,
      // 总发弹幕人数
      "chat.uv": chatUv,
      // 直播时间（分）
      "online.minutes": onlineMinutes,
      // 活跃人数
      "active.uv": activeUv,
    } = data
    $('.PlayerToolbar-Wealth').attr('showRoomData', `🎁礼物价值:${(formatPrice(giftAllPrice))}元🎅🏻礼物送礼人数:${formatData(giftAllUv)}💸付费礼物:${formatPrice(giftPaidPrice)}元🤴🏻付费送礼人数:${formatData(giftPaidUv)}`)
    $('.Title-col.is-right.h30').attr('showRoomData', `💬弹幕数:${formatData(chatPv)}🤩发弹幕人数:${formatData(chatUv)}🎤直播时间:${formatData(onlineMinutes)}分🔥活跃人数:${formatData(activeUv)}`)
  }

  // 隐藏显示房间数据
  function hideRoomData() {
    $('.PlayerToolbar-Wealth').attr('showRoomData', '')
    $('.Title-col.is-right.h30').attr('showRoomData', '')
  }
  // 数据格式化
  function formatData(num) {
    return String(num).replace(/(\d)(?=(\d{3})+$)/g, '$1,')
  }
  // 金钱格式化
  function formatPrice(num) {
    const str = String(num)
    const integer = formatData(str / 100 | 0)
    const decimal = String(str % 100).padStart(2, '0')
    return `${integer}.${decimal}`
  }

  GM_addStyle(`
html ::-webkit-scrollbar{height:14px;width:12px;overflow:visible;position:absolute;bottom:16px}html ::-webkit-scrollbar-button{height:0;width:0}html ::-webkit-scrollbar-thumb,html ::-webkit-scrollbar-track{background-clip:padding-box;border:3px solid transparent;border-radius:100px}html ::-webkit-scrollbar-corner{background-color:transparent}html ::-webkit-scrollbar-thumb{background-color:#ccc}html ::-webkit-scrollbar-track{background-color:hsla(0,0%,100%,0)}html body .broadcastDiv-af5699{display:none!important;opacity:0!important;visibility:hidden!important}html body #js-header{transition:opacity .5s;opacity:1}html body .layout-Main{transition:margin-top .5s;margin-top:0}html body #js-aside{margin-top:-68px;z-index:401}html body.head-hide #js-header{opacity:.1}html body .super-noble-icon-9aacaf,html body .super-tail-bffa58,html body .super-user-icon-574f31{display:none!important}html body .super-text-0281ca{background:none!important}html .Barrage{border-top:none}html .adjustClarity,html .danmuMove{display:none}html .room-Player-Box.mark [class^=danmuItem-]{cursor:default;pointer-events:none}html .danmuItem-31f924{background-color:transparent!important}html .danmuItem-31f924 .text-b132b0{font:700 24px SimHei,Microsoft JhengHei,Arial,Helvetica,sans-serif!important}html .Barrage-listItem>div:first-child{padding:0 10px!important;background-color:transparent!important;border-top:none!important;border-bottom:none!important}html .Barrage-listItem .Barrage-nickName{color:#2b94ff!important}html .Barrage-listItem .Barrage-nickName.is-self{color:#ff5d23!important}html .PlayerToolbar-Wealth:before,html .Title-col.is-right.h30:before{content:attr(ShowRoomData);float:left;font-size:12px;color:#888}html .layout-Player-asideMainTop.hide .layout-Player-announce{display:none}html .layout-Player-asideMainTop.hide .layout-Player-barrage{top:0}html .layout-Player-asideMainTop.hide .layout-Player-rank{border:none;display:none}html .layout-Player-asideMainTop.hide .ChatRank-rankWraper{display:none}html .noble-bf13ad{background:none!important}html .Barrage-notice--noble{background:none!important;border:none!important}html.no-background .bc-wrapper{background-color:transparent!important;background-image:none!important}html.no-background .Background-holder{padding-top:10px}html.no-background #js-bottom{display:none}html.no-background body{background-image:none;background-color:#ffe}html.no-background body.go-beyound{background-image:url(https://img-blog.csdnimg.cn/20210116195614315.jpg?x-oss-process=image%2Fwatermark%2Ctype_ZmFuZ3poZW5naGVpdGk%2Cshadow_10%2Ctext_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2MyODY4OTgyMzI%3D%2Csize_16%2Ccolor_FFFFFF%2Ct_70#pic_center);background-color:#f6f6f6;background-position:center 68px;background-repeat:repeat-y}html.no-background body .layout-Container{background-image:none;background-color:#ffe}html .is-fullScreenPage #wah0713{display:none}html #wah0713{position:fixed;top:50%;transform:translateY(-50%);right:-182px;border:1px solid #ccc;border-radius:6px;z-index:20;padding:10px 5px;background:#fef54e url(https://img-blog.csdnimg.cn/20210116195614319.jpg?x-oss-process=image%2Fwatermark%2Ctype_ZmFuZ3poZW5naGVpdGk%2Cshadow_10%2Ctext_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2MyODY4OTgyMzI%3D%2Csize_16%2Ccolor_FFFFFF%2Ct_70#pic_center) no-repeat 50%/100%;width:160px;transition:all .5s ease-out}html #wah0713.hasUpdate .tip{animation:Bigger 2s linear infinite}html #wah0713.hasUpdate .gear>img{animation-play-state:running}html #wah0713.hasUpdate .gear .redDot{display:block}html #wah0713 .tip{text-align:center;margin-bottom:5px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default}html #wah0713 .tip>a{color:red}html #wah0713:hover{right:0}html #wah0713:hover>button{opacity:1}html #wah0713 .gear{width:32px;padding-right:13px;position:absolute;top:50%;left:-45px;transform:translateY(-50%)}html #wah0713 .gear>img{width:100%;animation:rotating 30s linear infinite paused;border-radius:33%}html #wah0713 .gear .redDot{display:none;width:9px;height:9px;background-color:#fd4a4e;border-radius:50%;position:absolute;top:3px;right:13px}html #wah0713>button{margin:0 auto 5px;display:block;line-height:1;white-space:nowrap;cursor:pointer;background:#409eff;border:1px solid #409eff;color:#fff;-webkit-appearance:none;text-align:center;box-sizing:border-box;outline:none;transition:.1s;font-weight:500;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:6px 10px;font-size:14px;border-radius:4px;opacity:.75}html #wah0713>button:last-of-type{margin-bottom:0}html #wah0713>button:hover{opacity:.8}html #wah0713>button.close{background-color:#fff;color:#409eff}html #wah0713-alert{display:none;padding:8px 16px;position:fixed;top:30%;left:50%;transform:translateX(-50%);z-index:30;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;border:1px solid #ccc;border-radius:8px}html #wah0713-alert>i{width:14px;height:14px;display:inline-block;border-radius:50%;color:#fff;text-align:center;line-height:14px;font-family:Arial,Microsoft YaHei,黑体,宋体,sans-serif;margin-right:8px;position:relative;top:-1px}html #wah0713-alert.warning{background-color:#fff1f0;border-color:#f5222d}html #wah0713-alert.warning>i{background-color:#f5222d}html #wah0713-alert.info{background-color:#f4f4f5;border-color:#909399}html #wah0713-alert.info>i{background-color:#909399}html #wah0713-alert>span{font-family:Chinese Quote,-apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC,Hiragino Sans GB,Microsoft YaHei,Helvetica Neue,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;font-size:14px;font-variant:tabular-nums;color:rgba(0,0,0,.65)}html .marginTop100{margin-top:100px!important}html .background-image-hide{background-image:none!important;background-color:transparent!important}html .Barrage-list.trim .Barrage-listItem>div .UserLevel,html .Barrage-list.trim .Barrage-listItem>div .UserLevel~:not(.Barrage-nickName,.Barrage-content){display:none}#FansFestival2003Tips,#js-room-activity,.ActDayPay-toast,.activity-icon-4b45df,.activity-icon-c717fc,.ad-box-f661ba,.afterpic-8a2e13,.AnchorPocketTips,.AnchorReturnDialog,.Barrage-chat-ad,.Barrage-list .Barrage-message,.Barrage-list .Barrage-userEnter,.Barrage-topFloater,.Barrage-userEnter,.bc-f66a59,.Bottom-ad,.ChargeTask-closeBg,.closeBg-998534,.code-box-15b952,.code_box-5cdf5a,.DanmuEffectDom-container,.DiamondsFansBarrage,.DiamondsFansPromptPop,.EnterEffect,.FirePower,.FirePowerIcon,.FirePowerRewardModal,.FishShopTip,.focus_box_con-7adc83,.FuDaiActPanel,.FudaiGiftToolBarTips,.guessIconReminding,.Header-download-wrap,.HeaderNav,.headpic-dda332,.LotteryContainer-svgaDes,.LuckyStartEnter,.multiBitRate-da4b60,.noble-icon-88f562,.noble-icon-c10b6a,.normalBg-a5403d,.noSubFloat-3e7a50,.ordinaryBcBox-8220a7,.PaladinWeek-toast,.PcDiversion,.PeacehandBarrage,.PlayerToolbar-signCont,.PrivilegeGiftModalDialog,.RechargeBigRewards,.recommendAD-54569e,.RedEnvelopAd-adBox,.RoomText-wrap,.SignBaseComponent-sign-ad,.SysSign-Ad,.Title-roomOtherBottom,.user-icon-8af1e3,.user-icon-eeabb1,.vivo-ad-743527,.watermark-442a18,.WishingForestDialog,.WXTipsBox,.XinghaiAd,[class^=adsRoot_]{display:none!important}.opacity0{opacity:0}.is-hide{display:none!important}@keyframes rotating{0%{transform:rotate(0)}to{transform:rotate(1turn)}}@keyframes Bigger{0%{transform:scale(.95)}50%{transform:scale(1)}to{transform:scale(.95)}}
 `)
  // // debugJS
  // setTimeout(() => {
  // }, 5 * 1000);
})()