## Template support checklist
A list of things to do to add a template to the list of supported templates.
- [ ] Set a template type at WikiAttributionNotices.ts#attributionNoticeTemplatePages
- [ ] Create the template class
- [ ] Associate the template with its class at attributionNoticeClasses
- [ ] Create a page class for the template (must implement AttributionNoticePageLayout)
- [ ] Implement the page generator for the template model class
- [ ] (If allows merges), add the appropriate merger in the TemplateMerger
- [ ] Add the appropriate new notice generator in the TemplateFactory
- [ ] Add the related function in `insertNewNotice` of `CTEParsoidDocument`.
- [ ] Update position index in CTEParsoidDocument (and enable positioners)
