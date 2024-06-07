<script lang="ts">
import { defineComponent } from 'vue'
import { IconPlus, IconMinus, IconStar, IconCopy, IconGithub } from '@arco-design/web-vue/es/icon';
import { useClipboard } from '@vueuse/core'

export default defineComponent({
  components: {
    IconPlus, IconMinus, IconStar, IconCopy, IconGithub
  },
  data() {
    return {
      form: {
        subUrl: '',
        resultSubUrl: '',
        proxies: [
          { name: '', value: `{"name":""}` }
        ],
        groups: [
          { name: '', proxies: [] }
        ]

      }
    }
  },
  methods: {
    proxyAdd() {
      this.form.proxies.push({ name: '', value: '' })
    },
    proxyRemove(proxy: any) {
      if (this.form.proxies.length === 1) return;
      this.form.proxies = this.form.proxies.filter(p => p !== proxy);
      this.form.groups.forEach(g => {
        g.proxies = g.proxies.filter(p => p !== proxy.name)
      })
    },
    groupAdd() {
      this.form.groups.push({ name: '', proxies: [] })
    },
    groupRemove(group:any) {
      if (this.form.groups.length === 1) return;
      this.form.groups = this.form.groups.filter(g => g !== group)
    },
    proxyChange(val: string, proxy: any) {
      console.log('proxyChange')
      let proxyObj = JSON.parse(val);
      if (proxyObj) {
        proxy.name = proxyObj.name;
      }

    },
    genSubUrl() {
      console.log('genSubUrl')
      if (!this.form.subUrl) {
        this.$message.warning('源订阅地址必填!')
        return;
      }
      this.form.subUrl = this.form.subUrl.trim();
      if (!this.form.subUrl.startsWith('http') || !this.form.subUrl.startsWith('https')) {
        this.$message.warning('源订阅地址必须是http或https开头')
        return;
      }
      if (this.form.proxies.some(p => !p.name)) {
        this.$message.warning('Proxies至少填写一个!')
        return;
      }
      if (this.form.groups.some(g => !g.name)) {
        this.$message.warning('Groups至少填写一个!')
        return;
      }
      let apiUrl = "https://subconvert.aizsk.pro/";
      let proxiesList = this.form.proxies.filter(p => p.name).map(p => JSON.parse(p.value));
      let proxiesBase64 = encodeURIComponent(this.utf8ToBase64(JSON.stringify(proxiesList)));
      let groupsBase64 = encodeURIComponent(this.utf8ToBase64(JSON.stringify(this.form.groups)));
      let resultSubUrl = `${apiUrl}?subUrl=${encodeURIComponent(this.form.subUrl)}&proxies=${proxiesBase64}&groups=${groupsBase64}`;
      this.form.resultSubUrl = resultSubUrl;
    },
    copyResultUrl() {
      const { text, copy, copied, isSupported } = useClipboard({ source: this.form.resultSubUrl })
      copy(this.form.resultSubUrl);
      if (!isSupported.value) {
        this.$message.error('当前浏览器不支持复制!')
        return;
      }
      if (!copied) {
        this.$message.error('复制失败!')
        return;
      }
      this.$message.success('复制成功!')
    },
    utf8ToBase64(str: string) {
      const encoder = new TextEncoder();
      const utf8Array = encoder.encode(str);
      let binaryString = "";

      for (let byte of utf8Array) {
        binaryString += String.fromCharCode(byte);
      }

      return btoa(binaryString);
    },
    base64ToUtf8(base64: string) {
      const binaryString = atob(base64);
      const binaryArray = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        binaryArray[i] = binaryString.charCodeAt(i);
      }

      const decoder = new TextDecoder();
      return decoder.decode(binaryArray);
    },
    // 逆向genSubUrl还原信息到web页面
    parseSubUrl() {
      let subUrl = this.form.resultSubUrl;
      if (!subUrl) {
        this.$message.warning('定制订阅地址必填!')
        return;
      }
      let url = new URL(subUrl);
      let subUrlParam = url.searchParams.get('subUrl');
      let proxiesParam = url.searchParams.get('proxies');
      let groupsParam = url.searchParams.get('groups');
      if (!subUrlParam || !proxiesParam || !groupsParam) {
        this.$message.warning('定制订阅地址格式不正确!')
        return;
      }
      this.form.subUrl = decodeURIComponent(subUrlParam);
      try {
        let proxies = JSON.parse(this.base64ToUtf8(decodeURIComponent(proxiesParam))) as any[];
        this.form.proxies = proxies.map(p => ({ name: p.name, value: JSON.stringify(p) }));
        this.form.groups = JSON.parse(this.base64ToUtf8(decodeURIComponent(groupsParam)));
      } catch (error) {
        this.$message.error('解析定制订阅地址失败!')
      }
    }
  }
})
</script>


<template>
  <div class="body">
    <div class="header">
      <div class="header-left">
        <div class="header-title">订阅合并转换</div>
        <a style="margin-left:20px ;" href="https://github.com/jrt324/clash-sub-convert-ui" target="_blank">
          <icon-github size="16px" />
        </a>
      </div>


      <div>v0.01</div>
    </div>
    <div class="card-content">
      <a-form :model="form" auto-label-width>
        <a-form-item field="subUrl" label="源订阅地址:">
          <a-input v-model="form.subUrl" placeholder="请输入需要转换的订阅地址..." />
        </a-form-item>

        <a-form-item label="添加的Proxies:" :content-flex="false" :merge-props="false">
          <a-space direction="vertical" fill>
            <a-form-item hide-label field="proxy.value" v-for="proxy in form.proxies">
              <a class="proxy-name">{{ proxy.name }}</a>
              <a-input v-model="proxy.value" @change="val => proxyChange(val, proxy)" />

              <div class="buttons">
                <a-button type="primary" shape="circle" size="mini" @click="proxyAdd">
                  <icon-plus />
                </a-button>
                <div style="width: 5px;"></div>
                <a-button type="primary" status="warning" shape="circle" size="mini" @click="proxyRemove(proxy)">
                  <icon-minus />
                </a-button>
              </div>

            </a-form-item>
          </a-space>
        </a-form-item>

        <a-form-item label="归属Groups:" :content-flex="false" :merge-props="false">
          <a-space direction="vertical" fill>
            <a-form-item hide-label field="group.name" v-for="group in form.groups">
              <div class="group-name"> <a-input v-model="group.name" /></div>

              <a-select v-model="group.proxies" multiple>
                <a-option :value="proxy.name" v-for="proxy in form.proxies.filter(p => p.name)">{{ proxy.name
                  }}</a-option>
              </a-select>

              <div class="buttons">
                <a-button type="primary" shape="circle" size="mini" @click="groupAdd">
                  <icon-plus />
                </a-button>
                <div style="width: 5px;"></div>
                <a-button type="primary" status="warning" shape="circle" size="mini" @click="groupRemove(group)">
                  <icon-minus />
                </a-button>
              </div>
            </a-form-item>

          </a-space>
        </a-form-item>

        <a-divider :margin="10" :style="{ marginBottom: '30px' }"><icon-star /></a-divider>

        <a-form-item field="resultSubUrl" label="定制订阅地址:">

          <a-input v-model="form.resultSubUrl" allow-clear>
            <template #append>
              <div class="copy" @click="copyResultUrl"><icon-copy />复制</div>
            </template>
          </a-input>
        </a-form-item>


        <a-form-item>
          <a-space>
            <a-button type="primary" status="danger" @click="genSubUrl">生成定制订阅链接</a-button>

            <a-button type="primary" status="warning" style="margin-left: 25px;"
              @click="parseSubUrl">解析定制订阅链接</a-button>
          </a-space>

        </a-form-item>

      </a-form>
    </div>

  </div>



</template>

<style lang="scss" scoped>
.body {
  margin: 8px;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  display: flex;
  flex-direction: column;
  // padding: 20px;

  .header {
    display: flex;
    align-items: center;
    padding: 20px 14px;
    border-bottom: 1px solid #ebeef5;
    justify-content: space-between;
    font-size: 16px;

    &-left {
      display: flex;
    }

    &-title {
      display: flex;
      font-size: 16px;
      font-weight: bold;
    }
  }

  .card-content {
    display: flex;
    padding: 20px;
  }

  .row {
    display: flex;
    align-items: center;

    margin-bottom: 20px;

    .label {
      width: 100px;
      text-align: right;
      margin-right: 10px;
    }

    .content {
      flex: 1;
    }
  }

  .proxy-name {
    margin-right: 10px;
    width: 150px;
    height: 24px;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 5px;
    color: rgb(var(--arcoblue-6));
    background-color: rgb(var(--arcoblue-1));
    border: 1px solid transparent;
  }

  .group-name {
    width: 150px;
    margin-right: 10px;
  }

  .buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 10px;
  }

  .copy {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: rgb(var(--arcoblue-6));
    background-color: rgb(var(--arcoblue-1));
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 0 10px;
  }
}
</style>
