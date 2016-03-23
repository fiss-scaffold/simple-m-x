//注册fis3-media-manage
require('fis3-media-manage')(fis);

//发布路径设置
fis.media('dev')
.set('release', {
    //'dir': 'output',
    'watch': true,
    'live': true,
    'clean': false,
    'lint': true,
    'clear': true
});

var urlPre = '/zt/xxx';
var mergeConfg = {
    '/src/index.html': 'index',
    '/src/page1.html': 'page1',
    '/src/page2.html': 'page2'
};

fis.set('project.files', [
    'src/**'
]);


//添加忽略的文件列表
/*fis.set('project.ignore', [
    'output/**',
    'node_modules/**',
    '.git/**',
    '.svn/**',
    'package.json',
]);*/


//package 设置
fis.match('::package', {
    spriter: fis.plugin('csssprites-plus', {
        margin: 10,
        layout: 'matrix',
        to: '/img'
    })
});

/**
 * 开发阶段(dev)打包配置
 * 不对css/js/img进行合并，一切都是按需加载
 * scss之类的文件会编译成最终产物css等
 * inline内嵌的资源会被自动合并进宿主文件
 * 为了防止缓存，所有资源打包时添加hash值（只用于开发阶段，上线时通过版本系统来控制更新)
 * 打开html/css/js的语法检查提示
 * 默认开启文件修改自动刷新浏览器机制
 * 默认的构建后的文件放在系统默认的输出路径（通过fiss server open查看）
 */

//资源预处理
//通用资源处理
fis.match('src/(**)', {
    release: '$1',
    useHash: true
});

fis.match('**.html', {
    useHash: false
});

//特殊路径下的资源处理
fis.match('src/(test/**)', {
    useHash: false
});

fis.match('scss/(*.scss)', {
    parser: fis.plugin('node-sass-x'),
    rExt: '.css',
    release:'/css/$1'
});

fis.match('/src/test/server.conf', {
    release: '/config/server.conf'
});

fis.match('src/js/(lib/**)', {
    useHash: false
});

fis.match('src/fragment/**', {
    release: false,
});

//------------------------------------代码校验BEGIN----------------------------

fis
//html 校验
    .match('*.html', {
        lint: fis.plugin('html-hint', {
            // HTMLHint Options
            ignoreFiles: [],
            rules: {
                "tag-pair": true,
                "doctype-first": true,
                "spec-char-escape": true,
                "id-unique": true,
            }
        })
    })
    // css 校验
    .match('*.css', {
        lint: fis.plugin('csslint', {
            ignoreFiles: [],
            rules: {
                "known-properties": 2,
                "empty-rules": 1,
                "duplicate-properties": 2
            }
        })
    })
    //js 校验
    .match('*.js', {
        lint: fis.plugin('eslint', {
            ignoreFiles: ['lib/**.js', 'fis-conf.js', 'test/**.js'],
            rules: {
                "no-unused-expressions": 1,
                "no-unused-vars": 1,
                "no-use-before-define": 2,
                "no-undef": 2,
            },
            //envs:[],
            globals: [ //这里配置你自己的全局变量
                'zt',
            ]
        })
    });
//------------------------------------代码校验END----------------------------
//添加各种规则

fis
.addMediaRule('css_need_sprite',
    '*.{css,scss}',{
        useSprite: true
    }
)
.addMediaRule('pack_js_css_in_one',
    '::package', {
        postpackager: fis.plugin('loader-x', {
            allInOne: {
                js: function(filepath) {
                    return '/js/' + mergeConfg[filepath] + '.js';
                },
                css: function(filepath) {
                    return '/css/' + mergeConfg[filepath] + '.css';
                }
            }
        })
    }
)
.addMediaRule('preqa_and_skip_packed',
    '**', {
    deploy: [
        fis.plugin('skip-packed', {
            // 配置项
            //ignore:[]
        }),

        fis.plugin('local-deliver', {
            to: 'preview'
        })
    ]
})
.addMediaRule('publish_and_skip_packed',
    '**', {
    deploy: [
        fis.plugin('skip-packed', {
            // 配置项
            //ignore:[]
        }),

        fis.plugin('local-deliver', {
            to: 'publish'
        })
    ]
})
.addMediaRule('exclude_test',
    '{test/*,config/*}', {
        release: false
    }
)
.addMediaRule('css_replace_online_uri',
    '*.{css,scss}', {
        domain: 'http://c.58cdn.com.cn' + urlPre
    }
)
.addMediaRule('js_replace_online_uri',
    '*.js', {
        useHash: false,
        domain: 'http://j1.58cdn.com.cn' + urlPre
    }
)
.addMediaRule('img_replace_online_uri',
    '*.{png,jpg,jpeg,gif}', {
        useHash: true,
        domain: 'http://img.58cdn.com.cn' + urlPre
    }
)
.addMediaRule('compress_css',
    '*.{css,scss}', {
        optimizer: fis.plugin('clean-css'),
    }
)
.addMediaRule('compress_js',
    '*.js', {
        // fis-optimizer-uglify-js 插件进行压缩，已内置
        optimizer: fis.plugin('uglify-js'),
    }
)
.addMediaRule('compress_png',
    '*.png', {
        optimizer: fis.plugin('png-compressor'),
    }
)
.addMediaRule('compress_html',
        '*.html', {
        //需要安装插件 fis-optimizer-html-minifier
        optimizer: fis.plugin('html-minifier')
     }
)
.addMediaRule('deploy-all',
        '*',{
        deploy: [
            fis.plugin('skip-packed', {
                // 配置项
                //ignore:[]
            }),
            fis.plugin('ftp-x', {
                //'console':true,
                remoteDir: '/static.58.com/zt/xxx/',
                exclude: ['/img/'],
                connect: {
                    host: '192.168.119.5',
                    port: '21',
                    user: 'qatest',
                    password: 'ftp@fe'
                }
            }),
            fis.plugin('ftp-x', {
                //'console':true,
                remoteDir: '/pic2.58.com/zt/xxx/',
                include: ['/img/'],
                connect: {
                    host: '192.168.119.5',
                    port: '21',
                    user: 'qatest',
                    password: 'ftp@fe'
                }
            })
        ]
    }
)




/**
 * 自测(test)打包配置
 * 打开html/css/js的语法检查提示
 * 默认开启文件修改自动刷新浏览器机制
 * 对css/js/img进行合并，对已合并的资源不删除
 * 默认的构建后的文件放在系统默认的输出路径（通过fiss server open查看）
 */
fis.addMedia('test',[
    'css_need_sprite',
    'pack_js_css_in_one'
])
.set('release', {
    //'dir': 'output',
    'watch': true,
    'live': true,
    'clean': false,
    'lint': true,
    'clear': true
});


/**
 * 预提测(pre-qa)打包配置，在本地能进行完整的测试，保留模拟配置，提测前最后的检查
 * 对css/js/img进行合并，对已合并的资源进行删除，
 * 默认的构建后的文件放在系统默认的输出路径（通过fiss server open查看）
 */

fis.extendMedia('test','pre-qa',[
    'preqa_and_skip_packed'
]);



/**
 * 提测(qa)打包配置，除了资源不压缩，其他跟prod一样
 * 对css/js/img进行合并，对已合并的资源进行删除
 * 所有资源的引用地址替换domain/url/hash
 * 移除test下面的东西
 * 所有资源发布到publish路径
 * 所有资源不压缩
 */

fis.extendMedia('pre-qa','qa',[
    'publish_and_skip_packed',
    'exclude_test',
    'css_replace_online_uri',
    'js_replace_online_uri',
    'img_replace_online_uri'
],['preqa_and_skip_packed']);

/**
 * 上线(prod)打包配置
 * 对css/js/img进行合并，对已合并的资源进行删除
 * 所有资源的引用地址替换domain/url/hash
 * 移除test下面的东西
 * 所有资源发布到publish路径
 * 所有资源压缩
 */

fis.extendMedia('qa','prod',[
    'compress_css',
    'compress_js',
    'compress_png'
]);


/**
 * 上线(deploy-ftp)配置，并部署到ftp服务器
 * 对css/js/img进行合并，对已合并的资源进行删除
 * 所有资源的引用地址替换domain/url/hash
 * 移除test下面的东西
 * 所有资源压缩
 * 所有资源发布到ftp
 */


fis.extendMedia('prod','deploy-ftp',[
    'deploy-all',
])



/*// 调试时的配置
fis.media('debug').match('*.{js,css,scss,png}', {
    useHash: false,
    useSprite: false,
    optimizer: null
});
*/