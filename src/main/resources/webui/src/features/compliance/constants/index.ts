import { RuleType } from "@/types"

export const QUERIES = {
  POLICY_RULE_LIST: "policy-rule-list",
  RULE_LIST: "rule-list",
  RULE_SEARCH_LIST: "rule-search-list",
  RULE_DETAIL: "rule-detail",
  RULE_EXEMPTED_DEVICES: "rule-exempted-device",
  SOFTWARE_RULE_LIST: "software-rule-list",
  HARDWARE_RULE_LIST: "hardware-rule-list",
}

export const RULE_SCRIPT_TEMPLATE = {
  [RuleType.Javascript]: `
/*
 * Script template - to be customized.
 */
function check(device) {
    //var config = device.get('runningConfig');
    //var name = device.get('name');
    return CONFORMING;
    //return NONCONFORMING;
    //return NOTAPPLICABLE;
}
      `,
  [RuleType.Python]: `
# Script template - to be customized
def check(device):
  ## Grab some data:
  #  config = device.get('running_config')
  #  name = device.get('name')
  ## Some additional checks here...
  ## debug('device name = %s' % name)
  return result_option.CONFORMING
  # return {'result': result_option.NONCONFORMING, 'comment': 'Why it is not fine'}
  # return result_option.NOTAPPLICABLE
      `,
}
