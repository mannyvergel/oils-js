module.exports = function(webSelf) {
  let self = webSelf;

  let https = {
    enabled: false,

    letsEncrypt: {
      // Let's Encrypt v2 is ACME draft 11
      version: "draft-11",

      server: null, // actual key used

      // Used by oils
      prodServer: "https://acme-v02.api.letsencrypt.org/directory",

      // Used by oils
      // Note: If at first you don't succeed, stop and switch to staging
      stagingServer: "https://acme-staging-v02.api.letsencrypt.org/directory",

      // You MUST change this to a valid email address
      email: null,

      // You MUST NOT build clients that accept the ToS without asking the user
      agreeTos: true,

      // You MUST change these to valid domains
      // NOTE: all domains will validated and listed on the certificate
      // must override
      approveDomains: approveDomains, // override this if you want to be specific

      // You MUST have access to write to directory where certs are saved
      // ex: /home/foouser/acme/etc
      configDir: (self.conf.dataDir || (self.conf.baseDir + "/data")) + '/.config/acme/',

      // Get notified of important updates and help me make greenlock better
      communityMember: true,

      store: require('greenlock-store-fs'),

      testing: !self.conf.isProd,

      debug: !self.conf.isProd
    },

    port: 443,

    alwaysSecure: {
      enabled: false
    },

    getHttpsServer: function() {
      return require('https');
    }
  }

  return https; 
}

function approveDomains(opts, certs, cb) {
    // This is where you check your database and associated
    // email addresses with domains and agreements and such
    // if (!isAllowed(opts.domains)) { return cb(new Error("not allowed")); }
 
    // The domains being approved for the first time are listed in opts.domains
    // Certs being renewed are listed in certs.altnames (if that's useful)
 
    // Opt-in to submit stats and get important updates
    opts.communityMember = true;
 
    // If you wish to replace the default challenge plugin, you may do so here
    opts.challenges = { "http-01": http01 };
 
    opts.email = web.conf.https.letsEncrypt.email;
    opts.agreeTos = true;
 
    // NOTE: you can also change other options such as `challengeType` and `challenge`
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});
 
    cb(null, { options: opts, certs: certs });
}