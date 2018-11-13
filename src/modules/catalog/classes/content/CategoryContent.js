const slugify = require('slugify')
const {Asset, Content} = require('storyblok-ts-client')

const SeriesContent = require('./SeriesContent')
const ProductContent = require('./ProductContent')

const credentials = require('../../../../utilities').getCredentials()

module.exports = class CategoryContent extends Content {
  constructor(
    credentials,
    data,
    parent,
    contentStoryFolders,
    userData,
    categoryData
  ) {
    super(credentials, data, parent)
    this.contentStoryFolders = contentStoryFolders
    this.userData = userData
    this.categoryData = categoryData
    this.categories = []
    this.series = []
    this.products = []
    this.asset = undefined
  }

  get hasPhoto() {
    return !!this.categoryData.photo
  }

  async generate() {
    try {
      if (this.hasPhoto) {
        this.asset = new Asset(credentials, this.categoryData.photo)
        await this.asset.generatePhoto()
        this.data.content.photoUrl = this.asset.prettyUrl
      }
      this.categories = this.userData.categories
        .filter(record => record.parentCategory === this.categoryData.name)
        .map(this.instantiateCategory(this))
      this.series = this.userData.series
        .filter(record => record.parentCategory === this.categoryData.name)
        .map(this.instantiateSeries(this))
      this.products = this.userData.products
        .filter(record => record.parentCategory === this.categoryData.name)
        .map(this.instantiateProduct(this))
      await Promise.all([
        ...this.categories.map(c => c.generate()),
        ...this.series.map(s => s.generate()),
        ...this.products.map(p => p.generate()),
      ])
      this.data.content.categories = this.categories.map(c => c.uuid)
      this.data.content.series = this.series.map(s => s.uuid)
      this.data.content.products = this.products.map(p => p.uuid)
      await super.generate()
    } catch (error) {
      throw error
    }
  }

  instantiateCategory(categoryContent) {
    const parentNodeSlug =
      categoryContent.parent.fullSlug + '/' + categoryContent.slug
    return categoryData => {
      const slug = slugify(`category ${categoryData.name}`, {lower: true})
      return new CategoryContent(
        credentials,
        {
          name: categoryData.name,
          slug,
          tag_list: ['catalog', 'category', 'content'],
          path: `catalog/categories/${slug}/`,
          content: {
            component: 'categoryContent',
            headline: `${categoryData.name} Category`,
            name: categoryData.name,
            description: categoryData.description,
            photoUrl: undefined,
            parentNodeSlug,
            categories: [],
            series: [],
            products: [],
          },
        },
        this.contentStoryFolders.category,
        this.contentStoryFolders,
        this.userData,
        categoryData
      )
    }
  }

  instantiateSeries(categoryContent) {
    const parentNodeSlug =
      categoryContent.parent.fullSlug + '/' + categoryContent.slug
    return seriesData => {
      const slug = slugify(`series ${seriesData.name}`, {lower: true})
      return new SeriesContent(
        credentials,
        {
          name: seriesData.name,
          slug,
          tag_list: ['catalog', 'series', 'content'],
          path: `catalog/series/${slug}/`,
          content: {
            component: 'seriesContent',
            headline: `${seriesData.name} Series`,
            name: seriesData.name,
            description: seriesData.description,
            photoUrl: undefined,
            parentNodeSlug,
            products: [],
          },
        },
        this.contentStoryFolders.series,
        this.contentStoryFolders,
        this.userData,
        seriesData
      )
    }
  }

  instantiateProduct(categoryContent) {
    const parentNodeSlug =
      categoryContent.parent.fullSlug + '/' + categoryContent.slug
    return productData => {
      const slug = slugify(`model ${productData.model}`, {lower: true})
      return new ProductContent(
        credentials,
        {
          name: productData.model,
          slug,
          tag_list: ['catalog', 'product', 'content'],
          path: `catalog/product/${slug}/`,
          content: {
            component: 'productContent',
            headline: productData.name,
            model: productData.model,
            name: productData.name,
            description: productData.description,
            photoUrls: [],
            features: productData.features,
            specifications: undefined,
            isAccessory: productData.isAccessory,
            parentNodeSlug,
          },
        },
        this.contentStoryFolders.product,
        this.contentStoryFolders,
        this.userData,
        productData
      )
    }
  }
}