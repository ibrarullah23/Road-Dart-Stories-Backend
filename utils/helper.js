export function cleanFields(fieldsString = '') {
    return fieldsString.replace(/\s+/g, '').replace(/,/g, ' ');
}