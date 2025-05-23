window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    cc.macro.ENABLE_TRANSPARENT_CANVAS = true;
    var onProgress = null;
    window.loadingTime10 = null;
    window.loadingTime40 = null;
    window.loadingTime60 = null;
    window.loadingTime80 = null;
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;

    var dummyLoadingPercent = 0;
    const dummyLoadingIncrement = .2;
    var splash = document.getElementById('splash');
    var progressBar = splash.querySelector('.progress-bar span');
    var fakeProgressBarScheduler = setInterval(function () {
        dummyLoadingPercent += dummyLoadingIncrement;
        if (progressBar) {
            progressBar.style.width = dummyLoadingPercent.toFixed(2) + '%';
        }
    }, 200);

    function setLoadingDisplay() {
        // Loading splash scene
        onProgress = function (finish, total) {
            var percent = 100 * finish / total;
            // console.log("onProgress ", percent);
            if (window.bandwidthTestObj) {
                if (!window.loadingTime10 && percent >= 10) {
                    window.loadingTime10 = (Date.now() - window.startTimestamp) / 1000;
                    window.bandwidthTestObj.sendBandwidthInfo("PATCH");
                } else if (!window.loadingTime40 && percent >= 40) {
                    window.loadingTime40 = (Date.now() - window.startTimestamp) / 1000;
                    window.bandwidthTestObj.sendBandwidthInfo("PATCH");
                } else if (!window.loadingTime60 && percent >= 60) {
                    window.loadingTime60 = (Date.now() - window.startTimestamp) / 1000;
                    window.bandwidthTestObj.sendBandwidthInfo("PATCH");
                } else if (!window.loadingTime80 && percent >= 80) {
                    window.loadingTime80 = (Date.now() - window.startTimestamp) / 1000;
                    window.bandwidthTestObj.sendBandwidthInfo("PATCH");
                }
            }
            if (percent > dummyLoadingPercent && fakeProgressBarScheduler) {
                clearInterval(fakeProgressBarScheduler);
                fakeProgressBarScheduler = null;
            }
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
            clearInterval(fakeProgressBarScheduler);
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            // cc.view.enableAutoFullScreen([
            //     cc.sys.BROWSER_TYPE_BAIDU,
            //     cc.sys.BROWSER_TYPE_BAIDU_APP,
            //     cc.sys.BROWSER_TYPE_WECHAT,
            //     cc.sys.BROWSER_TYPE_MOBILE_QQ,
            //     cc.sys.BROWSER_TYPE_MIUI,
            //     cc.sys.BROWSER_TYPE_HUAWEI,
            //     cc.sys.BROWSER_TYPE_UC,
            // ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });
        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );
    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });

    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb(err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x; }), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.d1e34.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.d1e34.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}