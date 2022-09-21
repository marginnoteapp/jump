/**
 * MIT License
 * Copyright © 2022 MarginNote
 * Github: https://github.com/marginnoteapp/jump
 * Welcom to contribute to this project!
 */

try {
  const zh = {
    confirm: "确定",
    cancel: "取消",
    no_metaData: "检测到您并未安装 MetaData 插件，无法设置页码偏移量",
    offset: offset =>
      offset
        ? `当前文档的页码偏移量为 ${offset}`
        : "当前文档的页码偏移量为 0，可以前去 MetaData 插件中设置页码偏移量",
    download: "下载 MetaData",
    deleted: "该页已删除",
    out_range: "超出本书页码范围",
    gotopage: `转到指定页码`,
    enter_integer: "请输入整数"
  }
  const en = {
    confirm: "Confirm",
    cancel: "Cancel",
    deleted: "This page has been deleted",
    download: "Download MetaData",
    out_range: "Out of page range of this book",
    no_metaData:
      "You have not installed MetaData addon, so you can't set the page offset",
    offset: offset =>
      offset
        ? `This document's page offset is ${offset}`
        : "This document's page offset is 0, you can go to MetaData addon to set the page offset",
    gotopage: "Go To Page",
    enter_integer: "Please enter an integer"
  }
  JSB.newAddon = () => {
    const Addon = {
      name: "Jump",
      key: "jump"
    }
    const lang =
      NSLocale.preferredLanguages().length &&
      NSLocale.preferredLanguages()[0].startsWith("zh")
        ? zh
        : en
    const console = {
      log(obj, suffix = "normal") {
        JSB.log(`${Addon.key}-${suffix} %@`, obj)
      }
    }
    function getPageOffset(md5) {
      return NSUserDefaults.standardUserDefaults().objectForKey(
        "metadata_profile_doc"
      )?.[md5]?.addon?.pageOffset
    }
    function popup(title, message, type, buttons = [lang.confirm]) {
      return new Promise(resolve =>
        UIAlertView.showWithTitleMessageStyleCancelButtonTitleOtherButtonTitlesTapBlock(
          title,
          message,
          type,
          lang.cancel,
          buttons,
          (alert, buttonIndex) => {
            resolve(
              type === 2
                ? {
                    content: alert.textFieldAtIndex(0).text.trim(),
                    option: buttonIndex - 1
                  }
                : {
                    option: buttonIndex - 1
                  }
            )
          }
        )
      )
    }
    function showHUD(text, duration = 2) {
      Application.sharedInstance().showHUD(text, self.window, duration)
    }
    function openUrl(url) {
      Application.sharedInstance().openURL(NSURL.URLWithString(encodeURI(url)))
    }
    async function jump() {
      let offset = getPageOffset(self.docmd5)
      if (offset === undefined) {
        const { option } = await popup("Jump", lang.no_metaData, 0, [
          lang.download
        ])
        if (option === 0) {
          openUrl("https://github.com/marginnoteapp/jump")
        }
        return
      }
      offset = Number(offset)
      for (;;) {
        const { option, content } = await popup("Jump", lang.offset(offset), 2)
        if (option === -1) return
        const page = Number(content)
        if (Number.isInteger(page)) {
          const realPage = page + offset
          const index = self.documentController.indexFromPageNo(realPage)
          if (
            realPage > self.documentController.document.pageCount ||
            realPage < 1
          ) {
            showHUD(lang.out_range)
          } else if (index === 0 && realPage !== 1) {
            showHUD(lang.deleted)
          } else {
            self.documentController.setPageAtIndex(index)
            return
          }
        } else {
          showHUD(lang.enter_integer)
        }
      }
    }
    return JSB.defineClass(
      Addon.name + ": JSExtension",
      {
        sceneWillConnect() {
          self.status = false
          self.app = Application.sharedInstance()
          self.studyController = self.app.studyController(self.window)
        },
        documentDidOpen(docmd5) {
          self.docmd5 = docmd5
          self.documentController =
            self.studyController.readerController.currentDocumentController
        },
        queryAddonCommandStatus() {
          return self.studyController.studyMode !== 3
            ? {
                image: "logo.png",
                object: self,
                selector: "onToggle:",
                checked: self.status
              }
            : null
        },
        async onToggle() {
          self.status = true
          self.studyController.refreshAddonCommands()
          await jump()
          self.status = false
          self.studyController.refreshAddonCommands()
        }
      },
      {}
    )
  }
} catch (err) {
  JSB.log(`jump-error %@`, String(err))
}
