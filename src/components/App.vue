<template>
  <div id="app" ref="app">

    <div class="filter-container">
      <form class="ui form">
        <div class="fields">
          <div class="fifteen wide field">
            <div class="three fields">
              <foundation-select size="five" :data="this.$store.getters.scopes2" label="scope2" icon="tags"></foundation-select>
              <foundation-select size="five" :data="this.$store.getters.scopes1" label="scope1" icon="tags"></foundation-select>
              <foundation-filter v-if="chainType == 1" selectType="chain" :data="this.$store.getters.innochains" label="innochain" icon="rocket"></foundation-filter>
              <foundation-filter v-if="chainType == 2" selectType="chain" :data="this.$store.getters.educhains" label="educhain" icon="graduation cap"></foundation-filter>
            </div>
            <transition name="slide">
              <div class="two fields" v-show="extended || forceExtended">
                <foundation-filter :data="this.$store.getters.recipients" label="recipient" icon="user"></foundation-filter>
                <foundation-filter :data="this.$store.getters.grants" label="grant" icon="gift"></foundation-filter>
              </div>
            </transition>
          </div>
          <div class="field">
            <label class="label-without-content"></label>
            <button type="button" :class="[!extended ? 'basic' : 'basic black', 'ui fluid button icon']" @click="toggleExtendedFilter">
              <i :class="[extended ? 'close' : 'options', 'icon']"></i>
            </button>
          </div>
        </div>
      </form>
    </div>

    <foundation-map></foundation-map>
    <foundation-list></foundation-list>

    <div class="ui segment basic" style="text-align: center;">
      <a href="https://creativecommons.org/licenses/by/3.0/ch/" target="_blank">
        <img src="./../assets/cc_logo.svg" style="width: 100px">
      </a>
    </div>

  </div>
</template>

<script>
  import FoundationFilter from './FoundationFilter.vue'
  import FoundationMap from './FoundationMap.vue'
  import FoundationList from './FoundationList.vue'
  import FoundationSelect from './FoundationSelect.vue'

  export default {
    name: 'app',
    data: function(){
      return {
        extended: true,
        iframeHashUpdater: null,
        languageWatcher: null
      }
    },
    computed: {
      forceExtended(){
        return this.$store.state.recipient.selected.length > 0 || this.$store.state.grant.selected.length > 0
      },
      chainType(){
        return this.$store.state.scope1.selected.length > 0 ? this.$store.state.scope1.selected[0] : null
      }
    },
    methods: {
      toggleExtendedFilter(e){
        e.preventDefault()
        this.extended = !this.extended
      },
      resizeIframe(){
        const extra = 200
        const height = this.$refs.app.clientHeight
        window.frameElement.style.height = (height+extra) + 'px'
      }
    },
    components: {
      FoundationMap, FoundationList, FoundationFilter, FoundationSelect
    },
    mounted: function(){
      this.$store.dispatch('loadLanguage')
      this.$store.dispatch('loadHash')

      const regload = this.$store.dispatch('loadRegions')
      const recload = this.$store.dispatch('loadRecipients')
      const graload = this.$store.dispatch('loadGrants')
      const sc1load = this.$store.dispatch('loadScopes1')
      const sc2load = this.$store.dispatch('loadScopes2')
      const incload = this.$store.dispatch('loadInnochains')
      const edcload = this.$store.dispatch('loadEduchains')

      Promise.all([regload, recload, graload, sc1load, sc2load, incload, edcload]).then(values => {
        this.$store.dispatch('loadFoudations')
      }).catch(err => {
        console.log(err)
      })


      const self = this
      const domain = document.domain.match(/[a-z0-9\-]*.[a-z0-9\-]+$/i)[0]
      document.domain = domain
      const iframe = window.frameElement

      if(iframe){
        window.addEventListener('resize', this.resizeIframe)
        this.eventHub.$on('app-resize', () => {
          this.resizeIframe()
        })

        this.iframeHashUpdater = window.setInterval(() => {
          this.$store.dispatch('loadHash')
        }, 50)
      } else {
        window.addEventListener('hashchange', () => {
          this.$store.dispatch('loadHash')
        })
      }


      window.addEventListener('mousemove', function hideOptions(e){
        this.removeEventListener('mousemove', hideOptions)
        setTimeout(() => {
          self.extended = false
        }, 500)
      })

      this.eventHub.$on('goToMap', () => {
        if(iframe) {
          const top = iframe.getBoundingClientRect().top + window.parent.window.pageYOffset
          window.parent.window.scrollTo(0, top)
        } else {
          const top = 0
          window.scrollTo(0, top)
        }
      })

    },
    destroyed: function(){
      const iframe = window.frameElement

      this.eventHub.$off('goToMap')
      this.eventHub.$off('app-resize')

      window.removeEventListener('hashchange', this.loadHash)
      if(iframe) {
        window.removeEventListener('resize', this.resizeIframe)
        window.clearTimeout(this.iframeHashUpdater)
      }
    },
    updated: function(){
      this.eventHub.$emit('app-resize')
    }
  }
</script>

<style lang="less">
  #app {
    position: relative;
    max-width: 900px;
    margin: auto;
  }
  .filter-container {
    position: relative;
    z-index: 1000;

    .ui.form {

      .ui.icon.button {
        padding: 0.763em 0.6875em 0.763em;
      }

      & > .fields {
        margin-bottom: 0;
      }
      .fields {

        .label-without-content {
          &::after {
            content: '\00A0';
          }

          @media only screen and (max-width: 768px) {
            &::after {
              display: none;
            }
          }
        }
        @media only screen and (max-width: 768px) {
          .button {
            margin-bottom: 1em;
          }
        }



        &.slide-enter-active, &.slide-leave-active {
          transition: all 0.35s;
          max-height: 67px;
          overflow: hidden;
        }
        &.slide-enter, &.slide-leave-to  {
          max-height: 0px;
          margin: 0px;
        }

        @media only screen and (max-width: 768px) {
          &.slide-enter-active, &.slide-leave-active {
            transition: all 0.35s;
            max-height: 165px;
            overflow: hidden;
          }
          &.slide-enter, &.slide-leave-to  {
            max-height: 0px;
            margin: 0px;
          }
        }
      }
    }
  }
</style>
