;(function () {
  const zh = {
    confirm: '确定',
    cancel: '取消',
    enterOffset: '请在 MetaData -> 页码偏移量中输入当前文档的页码偏移量',
    offset: offset =>
      `当前文档的页码偏移量为 ${offset}，请输入想要去的页码，我会自动计算。`,
    gotopage: `转到指定页码`,
    enterInteger: '请输入整数'
  }
  const en = {
    confirm: 'Confirm',
    cancel: 'Cancel', enterOffset:
      'Please enter the page offset of the current document in MetaData-> Page Offset',
    offset: offset =>
      `The current document's page offset is ${offset}, please enter the page number you want to go and I will calculate it automatically.`,
    gotopage: 'Go To Page',
    enterInteger: 'Please enter an integer'
  }
  JSB.newAddon = () => {
    const Addon = {
      name: 'Jump',
      key: 'jump'
    }
    let pageOffsets = {}
    const lang =
      NSLocale.preferredLanguages().length &&
      NSLocale.preferredLanguages()[0].startsWith('zh')
        ? zh
        : en
    const console = {
      log(obj) {
        JSB.log(`${Addon.key} %@`, obj)
      }
    }
    const getPageOffset = (md5) => {
      const offset = NSUserDefaults.standardUserDefaults().objectForKey('metadata_profile_doc')?.[md5]?.addon?.pageOffset
      if(offset) return offset
    }
    const popup = (title, message, buttons = [lang.confirm]) => {
      return new Promise(resolve =>
        UIAlertView.showWithTitleMessageStyleCancelButtonTitleOtherButtonTitlesTapBlock(
          title,
          message,
          2,
          lang.cancel,
          buttons,
          (alert, buttonIndex) => {
            resolve({
              content: alert.textFieldAtIndex(0).text.trim(),
              option: buttonIndex - 1
            })
          }
        )
      )
    }
    const showHUD = (text, duration = 2) => {
      Application.sharedInstance().showHUD(text, self.window, duration)
    }
    const go = async () => {
      try {
        let offset = getPageOffset(self.docmd5) ?? pageOffsets[self.docmd5]
        if (offset === undefined) {
          showHUD(lang.enterOffset, 3)
          return
        }
        for (;;) {
          const { option, content } = await popup(
            'Jump',
            lang.offset(offset)
          )
          if (option === -1) return
          const page = Number(content)
          if (Number.isInteger(page)) {
            const documentController = self.studyController.readerController.currentDocumentController
            documentController.setPageAtIndex(documentController.indexFromPageNo(page + Number(offset)))
            return
          } else {
            showHUD(lang.enterInteger)
          }
        }
      } catch (err) {
        console.log(String(err))
      }
    }
    return JSB.defineClass(
      Addon.name + ': JSExtension',
      {
        sceneWillConnect() {
          self.status = false
          self.app = Application.sharedInstance()
          self.studyController = self.app.studyController(self.window)
          pageOffsets =
            NSUserDefaults.standardUserDefaults().objectForKey(
              'GoToPage.Offsets'
            ) ?? {}
        },
        documentDidOpen (docmd5) {
          self.docmd5 = docmd5
        },
        queryAddonCommandStatus() {
          return self.studyController.studyMode !== 3
            ? {
                image: 'logo.png',
                object: self,
                selector: 'onToggle:',
                checked: self.status
              }
            : null
        },
        async onToggle() {
          self.status = true
          self.studyController.refreshAddonCommands()
          await go()
          self.status = false
          self.studyController.refreshAddonCommands()
        }
      },
      {}
    )
  }
})()
