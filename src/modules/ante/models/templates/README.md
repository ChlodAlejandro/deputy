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

## Model paradigms
The following paradigms are used for the development of template and template row models.
- The template row model should be kept in a separate file from the main template model.
  - This ensures weird quirks with Rollup's dependency resolution won't occur. 
- Template models should embody global parameters for row-based templates, or all parameters for simple templates.
  - By embody, this means the parameter should be a field in the class.
  - The field on the class must be a string.
  - If the parameter is positional (`1`, `2`, etc.), fall back to a fitting variable name.
- Template row models should embody each row parameter without its numbered suffix.
  - By embody, this means the parameter should be a field in the class and a key in the raw row interface.
  - The field on the class must be a string.
- Aliases of a parameter should also be stored within the object.
  - The only exception for this are numbered parameters. These must use a name that is not a number. 
- Parameter values should only be modified if the template itself was modified, besides whitespace changes.
  - Any data sanitization (trimming, etc.) or alias handling should be processed by the page and not the model.
  - When saving, unknown parameters or parameters out of sequence must be left untouched.
- If values are supplied to multiple aliases of a parameter, they must be used in the order they appear in template code.
