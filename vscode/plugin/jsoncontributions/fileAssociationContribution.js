'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FileAssociationContribution = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _strings = require('../utils/strings');

var _strings2 = _interopRequireDefault(_strings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var globProperties = [{ type: "value", displayText: "Files with Extension", text: '"*.{{extension}}": "{{language}}"', description: "Map all files matching the glob pattern in their filename to the language with the given identifier." }, { type: "value", displayText: "Files with Path", text: '"/{{path to file}}/*.{{extension}}": "{{language}}"', description: "Map all files matching the absolute path glob pattern in their path to the language with the given identifier." }];

var FileAssociationContribution = exports.FileAssociationContribution = function () {
    function FileAssociationContribution() {
        _classCallCheck(this, FileAssociationContribution);
    }

    _createClass(FileAssociationContribution, [{
        key: 'setLanguageIds',
        value: function setLanguageIds(ids) {
            this.languageIds = ids;
        }
    }, {
        key: 'isSettingsFile',
        value: function isSettingsFile(resource) {
            return _strings2.default.endsWith(resource, '/settings.json');
        }
    }, {
        key: 'collectDefaultSuggestions',
        value: function collectDefaultSuggestions(resource, result) {
            return null;
        }
    }, {
        key: 'collectPropertySuggestions',
        value: function collectPropertySuggestions(resource, location, currentWord, addValue, isLast, result) {
            if (this.isSettingsFile(resource) && location.matches(['files.associations'])) {
                globProperties.forEach(function (e) {
                    return result.add(e);
                });
            }
            return null;
        }
    }, {
        key: 'collectValueSuggestions',
        value: function collectValueSuggestions(resource, location, currentKey, result) {
            if (this.isSettingsFile(resource) && location.matches(['files.associations'])) {
                this.languageIds.forEach(function (l) {
                    result.add({
                        type: "value",
                        displayText: l,
                        text: '"{{' + l + '}}"'
                    });
                });
            }
            return null;
        }
    }, {
        key: 'getInfoContribution',
        value: function getInfoContribution(resource, location) {
            return null;
        }
    }]);

    return FileAssociationContribution;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbmNvbnRyaWJ1dGlvbnMvZmlsZUFzc29jaWF0aW9uQ29udHJpYnV0aW9uLnRzIiwidnNjb2RlL3BsdWdpbi9qc29uY29udHJpYnV0aW9ucy9maWxlQXNzb2NpYXRpb25Db250cmlidXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUE7Ozs7Ozs7OztBQ0hBOzs7Ozs7OztBRFNBLElBQUksaUJBQStCLENBQy9CLEVBQUUsTUFBTSxPQUFSLEVBQWlCLGFBQWEsc0JBQTlCLEVBQXNELE1BQU0sbUNBQTVELEVBQWlHLGFBQWEsc0dBQTlHLEVBRCtCLEVBRS9CLEVBQUUsTUFBTSxPQUFSLEVBQWlCLGFBQWEsaUJBQTlCLEVBQWlELE1BQU0scURBQXZELEVBQThHLGFBQWEsZ0hBQTNILEVBRitCLENBQW5DOztJQUtBLDJCLFdBQUEsMkI7QUFHSSwyQ0FBQTtBQUFBO0FBQ0M7Ozs7dUNBRXFCLEcsRUFBYTtBQUMvQixpQkFBSyxXQUFMLEdBQW1CLEdBQW5CO0FBQ0g7Ozt1Q0FFc0IsUSxFQUFnQjtBQUNuQyxtQkFBTyxrQkFBUSxRQUFSLENBQWlCLFFBQWpCLEVBQTJCLGdCQUEzQixDQUFQO0FBQ0g7OztrREFFZ0MsUSxFQUFrQixNLEVBQTZCO0FBQzVFLG1CQUFPLElBQVA7QUFDSDs7O21EQUVpQyxRLEVBQWtCLFEsRUFBd0IsVyxFQUFxQixRLEVBQW1CLE0sRUFBaUIsTSxFQUE2QjtBQUM5SixnQkFBSSxLQUFLLGNBQUwsQ0FBb0IsUUFBcEIsS0FBaUMsU0FBUyxPQUFULENBQWlCLENBQUMsb0JBQUQsQ0FBakIsQ0FBckMsRUFBK0U7QUFDM0UsK0JBQWUsT0FBZixDQUF1QixVQUFDLENBQUQ7QUFBQSwyQkFBTyxPQUFPLEdBQVAsQ0FBVyxDQUFYLENBQVA7QUFBQSxpQkFBdkI7QUFDSDtBQUVELG1CQUFPLElBQVA7QUFDSDs7O2dEQUU4QixRLEVBQWtCLFEsRUFBd0IsVSxFQUFvQixNLEVBQTZCO0FBQ3RILGdCQUFJLEtBQUssY0FBTCxDQUFvQixRQUFwQixLQUFpQyxTQUFTLE9BQVQsQ0FBaUIsQ0FBQyxvQkFBRCxDQUFqQixDQUFyQyxFQUErRTtBQUMzRSxxQkFBSyxXQUFMLENBQWlCLE9BQWpCLENBQXlCLGFBQUM7QUFDdEIsMkJBQU8sR0FBUCxDQUFXO0FBQ1AsOEJBQU0sT0FEQztBQUVQLHFDQUFhLENBRk47QUFHUCw4QkFBTSxRQUFRLENBQVIsR0FBWTtBQUhYLHFCQUFYO0FBS0gsaUJBTkQ7QUFPSDtBQUVELG1CQUFPLElBQVA7QUFDSDs7OzRDQUUwQixRLEVBQWtCLFEsRUFBc0I7QUFDL0QsbUJBQU8sSUFBUDtBQUNIIiwiZmlsZSI6InZzY29kZS9wbHVnaW4vanNvbmNvbnRyaWJ1dGlvbnMvZmlsZUFzc29jaWF0aW9uQ29udHJpYnV0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBTdHJpbmdzIGZyb20gJy4uL3V0aWxzL3N0cmluZ3MnO1xyXG5pbXBvcnQge0lKU09OV29ya2VyQ29udHJpYnV0aW9uLCBJU3VnZ2VzdGlvbnNDb2xsZWN0b3J9IGZyb20gJy4uL2pzb25Db250cmlidXRpb25zJztcclxuaW1wb3J0IHtKU09OTG9jYXRpb259IGZyb20gJy4uL2pzb25Mb2NhdGlvbic7XHJcblxyXG5sZXQgZ2xvYlByb3BlcnRpZXM6IFN1Z2dlc3Rpb25bXSA9IFtcclxuICAgIHsgdHlwZTogXCJ2YWx1ZVwiLCBkaXNwbGF5VGV4dDogXCJGaWxlcyB3aXRoIEV4dGVuc2lvblwiLCB0ZXh0OiAnXCIqLnt7ZXh0ZW5zaW9ufX1cIjogXCJ7e2xhbmd1YWdlfX1cIicsIGRlc2NyaXB0aW9uOiBcIk1hcCBhbGwgZmlsZXMgbWF0Y2hpbmcgdGhlIGdsb2IgcGF0dGVybiBpbiB0aGVpciBmaWxlbmFtZSB0byB0aGUgbGFuZ3VhZ2Ugd2l0aCB0aGUgZ2l2ZW4gaWRlbnRpZmllci5cIiB9LFxyXG4gICAgeyB0eXBlOiBcInZhbHVlXCIsIGRpc3BsYXlUZXh0OiBcIkZpbGVzIHdpdGggUGF0aFwiLCB0ZXh0OiAnXCIve3twYXRoIHRvIGZpbGV9fS8qLnt7ZXh0ZW5zaW9ufX1cIjogXCJ7e2xhbmd1YWdlfX1cIicsIGRlc2NyaXB0aW9uOiBcIk1hcCBhbGwgZmlsZXMgbWF0Y2hpbmcgdGhlIGFic29sdXRlIHBhdGggZ2xvYiBwYXR0ZXJuIGluIHRoZWlyIHBhdGggdG8gdGhlIGxhbmd1YWdlIHdpdGggdGhlIGdpdmVuIGlkZW50aWZpZXIuXCIgfVxyXG5dO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZpbGVBc3NvY2lhdGlvbkNvbnRyaWJ1dGlvbiBpbXBsZW1lbnRzIElKU09OV29ya2VyQ29udHJpYnV0aW9uIHtcclxuICAgIHByaXZhdGUgbGFuZ3VhZ2VJZHM6IHN0cmluZ1tdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRMYW5ndWFnZUlkcyhpZHM6IHN0cmluZ1tdKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5sYW5ndWFnZUlkcyA9IGlkcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlzU2V0dGluZ3NGaWxlKHJlc291cmNlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gU3RyaW5ncy5lbmRzV2l0aChyZXNvdXJjZSwgJy9zZXR0aW5ncy5qc29uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbGxlY3REZWZhdWx0U3VnZ2VzdGlvbnMocmVzb3VyY2U6IHN0cmluZywgcmVzdWx0OiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb2xsZWN0UHJvcGVydHlTdWdnZXN0aW9ucyhyZXNvdXJjZTogc3RyaW5nLCBsb2NhdGlvbjogSlNPTkxvY2F0aW9uLCBjdXJyZW50V29yZDogc3RyaW5nLCBhZGRWYWx1ZTogYm9vbGVhbiwgaXNMYXN0OiBib29sZWFuLCByZXN1bHQ6IElTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc0ZpbGUocmVzb3VyY2UpICYmIGxvY2F0aW9uLm1hdGNoZXMoWydmaWxlcy5hc3NvY2lhdGlvbnMnXSkpIHtcclxuICAgICAgICAgICAgZ2xvYlByb3BlcnRpZXMuZm9yRWFjaCgoZSkgPT4gcmVzdWx0LmFkZChlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29sbGVjdFZhbHVlU3VnZ2VzdGlvbnMocmVzb3VyY2U6IHN0cmluZywgbG9jYXRpb246IEpTT05Mb2NhdGlvbiwgY3VycmVudEtleTogc3RyaW5nLCByZXN1bHQ6IElTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc0ZpbGUocmVzb3VyY2UpICYmIGxvY2F0aW9uLm1hdGNoZXMoWydmaWxlcy5hc3NvY2lhdGlvbnMnXSkpIHtcclxuICAgICAgICAgICAgdGhpcy5sYW5ndWFnZUlkcy5mb3JFYWNoKGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmFkZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ2YWx1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlUZXh0OiBsLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdcInt7JyArIGwgKyAnfX1cIicsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0SW5mb0NvbnRyaWJ1dGlvbihyZXNvdXJjZTogc3RyaW5nLCBsb2NhdGlvbjogSlNPTkxvY2F0aW9uKTogUHJvbWlzZTxNYXJrZWRTdHJpbmdbXT4ge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59IiwiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IFN0cmluZ3MgZnJvbSAnLi4vdXRpbHMvc3RyaW5ncyc7XG5sZXQgZ2xvYlByb3BlcnRpZXMgPSBbXG4gICAgeyB0eXBlOiBcInZhbHVlXCIsIGRpc3BsYXlUZXh0OiBcIkZpbGVzIHdpdGggRXh0ZW5zaW9uXCIsIHRleHQ6ICdcIioue3tleHRlbnNpb259fVwiOiBcInt7bGFuZ3VhZ2V9fVwiJywgZGVzY3JpcHRpb246IFwiTWFwIGFsbCBmaWxlcyBtYXRjaGluZyB0aGUgZ2xvYiBwYXR0ZXJuIGluIHRoZWlyIGZpbGVuYW1lIHRvIHRoZSBsYW5ndWFnZSB3aXRoIHRoZSBnaXZlbiBpZGVudGlmaWVyLlwiIH0sXG4gICAgeyB0eXBlOiBcInZhbHVlXCIsIGRpc3BsYXlUZXh0OiBcIkZpbGVzIHdpdGggUGF0aFwiLCB0ZXh0OiAnXCIve3twYXRoIHRvIGZpbGV9fS8qLnt7ZXh0ZW5zaW9ufX1cIjogXCJ7e2xhbmd1YWdlfX1cIicsIGRlc2NyaXB0aW9uOiBcIk1hcCBhbGwgZmlsZXMgbWF0Y2hpbmcgdGhlIGFic29sdXRlIHBhdGggZ2xvYiBwYXR0ZXJuIGluIHRoZWlyIHBhdGggdG8gdGhlIGxhbmd1YWdlIHdpdGggdGhlIGdpdmVuIGlkZW50aWZpZXIuXCIgfVxuXTtcbmV4cG9ydCBjbGFzcyBGaWxlQXNzb2NpYXRpb25Db250cmlidXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cbiAgICBzZXRMYW5ndWFnZUlkcyhpZHMpIHtcbiAgICAgICAgdGhpcy5sYW5ndWFnZUlkcyA9IGlkcztcbiAgICB9XG4gICAgaXNTZXR0aW5nc0ZpbGUocmVzb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZ3MuZW5kc1dpdGgocmVzb3VyY2UsICcvc2V0dGluZ3MuanNvbicpO1xuICAgIH1cbiAgICBjb2xsZWN0RGVmYXVsdFN1Z2dlc3Rpb25zKHJlc291cmNlLCByZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbGxlY3RQcm9wZXJ0eVN1Z2dlc3Rpb25zKHJlc291cmNlLCBsb2NhdGlvbiwgY3VycmVudFdvcmQsIGFkZFZhbHVlLCBpc0xhc3QsIHJlc3VsdCkge1xuICAgICAgICBpZiAodGhpcy5pc1NldHRpbmdzRmlsZShyZXNvdXJjZSkgJiYgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZpbGVzLmFzc29jaWF0aW9ucyddKSkge1xuICAgICAgICAgICAgZ2xvYlByb3BlcnRpZXMuZm9yRWFjaCgoZSkgPT4gcmVzdWx0LmFkZChlKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbGxlY3RWYWx1ZVN1Z2dlc3Rpb25zKHJlc291cmNlLCBsb2NhdGlvbiwgY3VycmVudEtleSwgcmVzdWx0KSB7XG4gICAgICAgIGlmICh0aGlzLmlzU2V0dGluZ3NGaWxlKHJlc291cmNlKSAmJiBsb2NhdGlvbi5tYXRjaGVzKFsnZmlsZXMuYXNzb2NpYXRpb25zJ10pKSB7XG4gICAgICAgICAgICB0aGlzLmxhbmd1YWdlSWRzLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmFkZCh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidmFsdWVcIixcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IGwsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdcInt7JyArIGwgKyAnfX1cIicsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZ2V0SW5mb0NvbnRyaWJ1dGlvbihyZXNvdXJjZSwgbG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
