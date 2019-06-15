// ==UserScript==
// @name         斗鱼去火箭横幅(贵族弹幕样式&&聊天区域铭牌)
// @namespace    https://github.com/wah0713/myTampermonkey
// @version      1.88
// @description  一个兴趣使然的脚本，本来只是屏蔽火箭横幅的脚本，到后来。。。 【★功能按钮】 默认最高画质、弹幕悬停、竞猜显示、抽奖显示、背景显示、聊天框简化、完成日常奖励、禁言消息显示。 【★默认设置】左侧展开默认收起、弹幕简化（贵族弹幕）、聊天框消息简化（聊天区域铭牌、大部分系统消息）【★屏蔽】火力全开（输入框上方）、播放器内关注按钮、右侧浮动广告、火箭横幅、亲密互动(播放器左下角)、贵族入场提醒（输入框上方）、贵族入场提醒（输入框上方）、分享 客户端 手游中心（播放器右上角）、导航栏客户端按钮、播放器内主播推荐关注弹幕、播放器内房间号日期（播放器内左下角）、播放器左下角下载客户端QR、播放器左侧亲密互动、未登录提示、分区推荐弹幕、游侠活动、聊天框上方贵族发言、播放器左下方广告、聊天框内广告、底部广告、画面卡顿提示框、播放器右下角悬浮广告。
// @supportURL   https://github.com/wah0713/myTampermonkey/issues
// @author       wah0713
// @compatible   chrome
// @license      MIT
// @icon         https://www.douyu.com/favicon.ico
// @require      https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @match        http*://www.douyu.com/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    if (!/^\/\d+$/.test(window.location.pathname) && window.location.pathname.indexOf('topic') === -1) return false
    // 引入定制的样式
    const myCss = $(`<link class='my-css' rel='stylesheet' href='https://wah0713.github.io/myTampermonkey/dist/prod.css'>`)
    $('head').append(myCss)
    $('.my-css')[0].onerror = () => {
        alert('网络问题，脚本执行出错！')
    }
    $('.my-css')[0].onload = () => {
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
        let sign = 0
        // 日常任务的按钮数量
        let $TreasureBoxBtnList = 0
        // Background-holder的原始paddingTop值
        let InitiaGuessGameHeight = 0
        // 初始竞猜高度
        let OriginalbackgroundGolderPaddingTop = $('.Background-holder').css('padding-top') || 0
        // 5秒延迟
        let delay = false
        // 版本号
        const version = 1.88
        // 更新说明
        const updateNotes = version + '：1、增自动获取日常奖励 适应斗鱼新版 （测试量太少了） 2、时间不对问题尝试修复（测试量太少了）'

        // 只需要一次删除
        let onceRemoveDomList = [
            // 火力全开（输入框上方）、
            '.FirePower',
            // 播放器内关注按钮、
            '.focus_box_con-7adc83',
            // 右侧浮动广告、
            ' #js-room-activity',
            // 火箭横幅、
            '.broadcastDiv-af5699',
            // 亲密互动(播放器左下角)、
            '.closeBg-998534',
            // 贵族入场提醒（输入框上方）、
            '.EnterEffect',
            // 贵族入场提醒（输入框上方）、
            '.Title-roomOtherBottom',
            // 分享 客户端 手游中心（播放器右上角）、
            '.Header-download-wrap',
            // 导航栏客户端按钮、
            '.noSubFloat-3e7a50',
            // 播放器内主播推荐关注弹幕、
            '.watermark-442a18',
            // 播放器内房间号日期（播放器内左下角）、
            '.code_box-5cdf5a',
            '.code-box-15b952',
            // 播放器左下角下载客户端QR、
            '.normalBg-a5403d',
            // 播放器左侧亲密互动、
            '.multiBitRate-da4b60',
            // 未登录提示、
            '.ordinaryBcBox-8220a7',
            // 分区推荐弹幕、
            '.PaladinWeek-toast',
            // 游侠活动
            '.Barrage-topFloater',
            // 聊天框上方贵族发言
            '.RoomText-wrap',
            // 播放器左下方广告
            '.Barrage-chat-ad',
            '.SysSign-Ad',
            // 聊天框内广告
            '.PcDiversion',
            // 画面卡顿提示框
            '.guessIconReminding',
            // 主播推荐竞猜
            '.FuDaiActPanel',
            // 福袋狂欢
            '.ad-box-f661ba'
            // 播放器右下角悬浮广告
        ]
        let onceTempArr = []
        // 需要重复删除
        const removeDomList = [
            // 火力全开弹幕
            '.afterpic-8a2e13',
            // 火力全开聊天区域
            '.FirePowerIcon',
            // 播放器内贵族样式弹幕（降级为普通弹幕）
            '.user-icon-8af1e3',
            '.noble-icon-c10b6a',
            // 播放器内分区弹幕
            '.bc-f66a59',
            // 播放器内火力全开获奖
            '.FirePowerRewardModal',
            // 2019.520贵族样式
            '.activity-icon-c717fc',
            '.user-icon-eeabb1',
            '.noble-icon-88f562',
            '.activity-icon-4b45df'
        ]

        // 只执行一次
        let once = {
            notProcessedAdjustClarity: true,
            backgroundIsShow: true,
            removeBottomAd: true,
            InitiaGuessGameHeight: true,
            isFlashPlayer: true,
            AdjustClarityDelay: true
        }

        const target = $('body')[0]

        // 用户默认配置
        let defaultConfig = {
            adjustClarity: false, // 登陆最高画质
            danmuMove: false, // 弹幕悬停
            guessIsShow: false, // 竞猜显示
            lotteryIsShow: false, // 抽奖显示
            backgroundIsShow: false, // 背景显示
            chatBoxCleaning: true, // 聊天框简化
            forbiddenMessage: false, // 禁言消息显示
            autoReward: false, // 完成日常奖励
        }
        let config = GM_getValue('Config', defaultConfig)
        for (let key in defaultConfig) {
            if (typeof (config[key]) === 'undefined') {
                config[key] = defaultConfig[key]
            }
        }
        window.onbeforeunload = () => {
            GM_setValue('Config', config)
        }

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
                config[localStorageName] = !config[localStorageName]
                btnInit()
                if (typeof (once[localStorageName]) !== 'undefined') {
                    once[localStorageName] = true
                }
            })
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
            $('#wah0713-alert >span').text(params.message).parent('#wah0713-alert')
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
                    $('#wah0713-alert').show()
                })
            }
        }
        // 右侧自定义按钮模块
        $('body').append('<div id="wah0713"><img src="https://wah0713.github.io/myTampermonkey/image/config.jpg"></div>')
        $('#wah0713').mouseenter(() => {
            $('#wah0713').css('transition', 'all 0.5s ease-out')
            $('#wah0713 >img').fadeOut("slow")
            myAlert({
                message: updateNotes,
                type: 'info',
                dom: $('#wah0713 >.tip')
            })
        }).mouseleave(() => {
            $('#wah0713 >img').fadeIn("slow")
        })

        // 版本号和提示语
        $("#wah0713").append(`<p class='tip'>${version}更新版本内容：</br>因为现在tampermonkey插件调整画质会出现时间不同步的问题，所以不推荐开启脚本时调整画质</p>`)

        // 按钮事件
        btnListFun('adjustClarity', '默认最高画质', '10秒后开启当前房间最高画质，可能会闪一次屏（因为现在tampermonkey插件调整画质会出现时间不同步的问题，所以不推荐开启脚本时调整画质）__本功能由noob-one提出')
        btnListFun('danmuMove', '弹幕悬停', '播放器内弹幕被选中时悬停__本功能由noob-one提出')
        btnListFun('guessIsShow', '竞猜显示', '竞猜是否显示__本功能由noob-one提出')
        btnListFun('lotteryIsShow', '抽奖显示', '抽奖是否显示__本功能由lv88ff提出')
        btnListFun('backgroundIsShow', '背景显示', '背景是否显示__本功能由dongliang zhang提出')
        btnListFun('chatBoxCleaning', '聊天框简化', '聊天框头部去除主播公告、贡献周榜、贵宾、粉丝团和主播通知__本功能由dongliang zhang提出')
        btnListFun('autoReward', '完成日常奖励', '播放器左下角每天日常礼物自动获取，自动发弹幕“666”，（选择人多的直播间，以防尴尬）---功能还在测试中，欢迎反馈')
        btnListFun('forbiddenMessage', '禁言消息显示', '聊天框内用户被禁言消息是否显示__本功能由lv88ff提出')

        // 左侧展开默认收起
        if ($(".Aside-main--shrink").width() > 100) {
            $(".Aside-toggle").click()
        }

        // 自动发送弹幕封装
        function AutoDanmuSend() {
            let raddom = 2 + Math.ceil(8 * Math.random())
            let AutoDanmu = ''
            for (let i = 1; i <= raddom; i++) {
                AutoDanmu += '6'
            }
            $('.ChatSend-txt').val(AutoDanmu)
            $('.ChatSend-button').click()
        }

        // 日常奖励按钮封装
        function TreasureBoxBtnListHandle() {
            if ($TreasureBoxBtnList.length > 0) {
                $TreasureBoxBtnList.each((idx, dom) => {
                    $dom = $(dom)
                    if ($dom.hasClass('enable')) {
                        $dom.click()
                    } else if ($dom.hasClass('barrage-ready')) {
                        AutoDanmuSend()
                        return false
                    }
                })
            }
        }

        // 日常奖励自动获取
        let autoRewardTimeId = setInterval(() => {
            if ($('.autoReward')[0].style.display !== 'none' && config.autoReward) {
                let $FTP = $('.FTP')
                $TreasureBoxBtnList = $('.TreasureBox-btn')
                if (!$FTP.length) { // 弹框没有出来
                    $('.FishpondTreasure-icon').click()
                    $FTP = $('.FTP')
                    $TreasureBoxBtnList = $('.TreasureBox-btn')
                    $FTP.addClass('opacity0')
                    TreasureBoxBtnListHandle()
                    $FTP.removeClass('opacity0')
                    $('.FTP-close').click()
                } else { // 弹框出来
                    TreasureBoxBtnListHandle()
                }
            }
            if ($TreasureBoxBtnList.length === 0) {
                clearInterval(autoRewardTimeId)
                $('.autoReward').hide()
            }
        }, 30 * 1000)

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

        const observer = new MutationObserver(function () {

            // 开启高清画质延迟5秒
            if (once.AdjustClarityDelay && $('.tip-e3420a ul') && $('.tip-e3420a ul').children().length) {
                setTimeout(() => {
                    delay = true
                }, 10 * 1000)
                once.AdjustClarityDelay = false
            }

            // flash播放器
            if (once.isFlashPlayer && $('#room-flash-player').length) {
                myAlert({
                    message: '正在使用flash播放器，【斗鱼去火箭横幅】部分功能会失效',
                    type: 'warning',
                    time: 3
                })
                once.isFlashPlayer = false
            }

            // 获取初始竞猜高度
            if (once.InitiaGuessGameHeight && $('.Bottom-guessGame-placeholder').length) {
                InitiaGuessGameHeight = $('.Bottom-guessGame-placeholder').height()
                once.InitiaGuessGameHeight = false
            }
            // onceRemoveDomList模块
            onceTempArr = onceRemoveDomList.slice(0)
            let i = 0
            onceRemoveDomList.length && onceRemoveDomList.forEach((dom, idx) => {
                if ($(dom).remove().length != 0) {
                    onceTempArr.splice(idx + i, 1)
                    i--
                }
            })
            onceRemoveDomList = onceTempArr.slice(0)

            // removeDomList模块
            removeDomList.forEach((dom, idx) => {
                $(dom).remove()
            })

            // 底部广告（特殊dom）
            if (once.removeBottomAd && $('.Bottom-ad').length) {
                $('.Bottom-ad').hide()
                once.removeBottomAd = false
            }

            // 自定义按钮显示条件
            if ($('.UnLogin').length) {
                $('.adjustClarity').hide()
                $('.danmuMove').hide()
                $('.autoReward').hide()
            } else {
                $('.adjustClarity').show()
                $('.danmuMove').show()
                if ($TreasureBoxBtnList.length) {
                    $('.autoReward').show()
                }
            }

            // 抽奖显示
            if (config.lotteryIsShow) {
                // 抽奖中间部提示框、
                $(".LotteryContainer").show()
                // 抽奖(播放器左下角)、
                $(".UPlayerLotteryEnter").show()
                // 中奖播放器中显示
                $(".LotteryContainer-svgaWrap").show()
            } else {
                // 抽奖中间部提示框、
                $(".LotteryContainer").hide()
                // 抽奖(播放器左下角)、
                $(".UPlayerLotteryEnter").hide()
                // 中奖播放器中显示
                $(".LotteryContainer-svgaWrap").hide()
            }

            // 主播公告、贡献周榜、贵宾和粉丝团
            if (config.chatBoxCleaning) {
                $(".layout-Player-asideMainTop").addClass("hide")
            } else {
                $(".layout-Player-asideMainTop").removeClass("hide")
            }

            // 登录开启最高画质
            if ($('.adjustClarity')[0].style.display !== 'none' && config.adjustClarity) {
                if (delay && once.notProcessedAdjustClarity && $('.tip-e3420a ul') && $('.tip-e3420a ul').children().length && !$('.tip-e3420a ul li:first-child').hasClass('selected-3a8039')) {
                    $('.tip-e3420a ul li:first-child').click()
                    once.notProcessedAdjustClarity = false
                }
            }

            // 弹幕悬停关闭
            if ($('.danmuMove')[0].style.display !== 'none' && config.danmuMove) {
                $(".danmuItem-31f924 .mask").remove()
            } else {
                $('.danmuItem-31f924').each((idx, dom) => {
                    if (!$(dom)[0].handle) {
                        $(dom)[0].handle = true
                        $(dom).append('<div class="mask" style="height: 100%;width: 100%;position: absolute;top: 0;left: 0;z-index: 999; cursor:default;"></div>')
                    }
                })
            }

            // 竞猜显示
            if (config.guessIsShow) {
                // 聊天框用户竞猜获奖
                $('.Barrage-list .Barrage-guess').parent('.Barrage-listItem').show()
                $('.guessGameContainer').show()
                $(".ActivityItem").each((idx, dom) => {
                    if ($(dom).find(".GuessIcon").length === 0) {
                        $(dom).hide()
                    } else {
                        $(dom).show()
                    }
                })
                $('.Bottom-guessGame-placeholder').height(InitiaGuessGameHeight)
            } else {
                // 聊天框用户竞猜获奖
                $('.Barrage-list .Barrage-guess').parent('.Barrage-listItem').hide()
                $('.guessGameContainer').hide()
                $(".ActivityItem").hide()
                $('.Bottom-guessGame-placeholder').height(0)
            }

            // 背景图
            if (config.backgroundIsShow && !$('.is-fullScreenPage').length) {
                // 播放器位置
                $('.Background-holder').css('padding-top', OriginalbackgroundGolderPaddingTop)
                $('html').removeClass('no-background')
                // 底部广告
                $('#js-bottom').show()
                $('body')[0].style = ""
                if ($('.layout-Container')[0]) {
                    $('.layout-Container')[0].style = ""
                }
                // 支持url带 /topic
                if (window.location.pathname.indexOf('topic') > -1) {
                    $('.layout-Main')[0].removeAttribute('style')
                }
                $('.bc-wrapper').show()
                $('body').addClass('backgroundIsShow')
            } else {
                // 播放器位置
                $('.Background-holder').css('padding-top', 10)
                // 底部广告
                $('#js-bottom').hide()
                $('html').addClass('no-background')
                if ($('.layout-Main').offset().top < $(window).height() * 1 / 2) {
                    $('body').css({
                        'background-image': 'none',
                        'background-color': '#ffe'
                    })
                } else {
                    $('body').css({
                        'background-image': "url('https://wah0713.github.io/myTampermonkey/image/down.jpg')",
                        'background-color': '#f6f6f6',
                        'background-position': 'center 68px',
                        'background-repeat': 'repeat-y'
                    })
                }
                $('.layout-Container') && $('.layout-Container').css({
                    'background-image': 'none',
                    'background-color': '#ffe'
                })
                // 支持url带 /topic
                if (window.location.pathname.indexOf('topic') > -1) {
                    $('.layout-Main')[0].setAttribute('style',
                        'margin-top: 80px;'
                    )
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
                $('.bc-wrapper').not($('.bc-wrapper')[sign]).hide()
                $('body').removeClass('backgroundIsShow')
            }

            // 播发器调整定位
            if (once.backgroundIsShow) {
                if (document.documentElement) {
                    document.documentElement.scrollTo(0, $(".layout-Player").offset().top - 80)
                } else if (document.body) {
                    document.body.scrollTo(0, $(".layout-Player").offset().top - 80)
                }
                once.backgroundIsShow = false
            }

            // 去掉播放器下方活动列表
            $('.ToolbarGiftArea').length === 1 && $('.ToolbarGiftArea').children().not('.GiftInfoPanel').not('.ToolbarGiftArea-GiftBox').not('.ToolbarGiftArea-giftExpandBox').not($('.ToolbarGiftArea').children().eq(-1)).hide()

            // 输入框上方送礼3000毫米淡出
            $('#js-player-barrage .BarrageBanner').children().delay(1000 * 3).fadeOut('slow')

            // 聊天框用户进入欢迎语
            $('.Barrage-list .Barrage-userEnter').parent('.Barrage-listItem').hide()

            // 聊天框用户送礼
            $('.Barrage-list .Barrage-message').parent('.Barrage-listItem').hide()

            // 聊天框用户相关消息广播
            // 系统提示（例如禁言）Barrage-notice--red
            $('.Barrage-list .Barrage-icon--sys').each((idx, dom) => {
                const domParent = $(dom).parent('.Barrage-listItem')
                if (config.forbiddenMessage) {
                    if (domParent.find('.Barrage-text').text().indexOf("禁言") === -1) {
                        domParent.hide()
                    } else {
                        domParent.show()
                    }
                } else {
                    domParent.hide()
                }
            })
            // 聊天框用户铭牌
            $('.Barrage-list .Barrage-nickName').prevAll().hide()
        })
        const observerConfig = {
            subtree: true,
            childList: true,
        }
        observer.observe(target, observerConfig)

        // // debugJS
        // setTimeout(() => {
        // }, 5 * 1000);

        // // debugStyle
        // const node = document.createTextNode(`
        // `)
        // $('head').append($(`<style type="text/css"></style>`).append(node))

    }
})()