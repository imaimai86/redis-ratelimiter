const ratelimiter = (by, key, context = '', lockType = 'auto', lockHandler, config) => {
    let idBy, tenant;
    //lockType = auto
    const parseReq = (req) = {
        byArray.forEach(by => {
            idBy.by = push(_.get(req, by) || _.get(req.body, by));
        });
        tenant = _.get(req, 'tenant');
    }
    const logRateLimited = () => {
        console.log(`Ratelimited: ${context} from (${by}, "${id}") on (tenant, "${tenant}") is locked for key: ${key}`);
    }
    return {
        validate: async (req, res, next) => {
            parseReq(req);

            if (lockType == 'auto') {
                await incrLock(by, _.get(req, by), key, req, context);
            }
            if (await isLocked(by, _.get(req, by), key, req, context)) {
                if (lockType != 'auto') {
                    await incrLock(by, _.get(req, by), key, req, context);
                }
                logRateLimited(req, by, key, context);
                return lockHandler && lockHandler(req, res, next) || next();
            }
            return next();
        },
        isLocked: async (request, id) => {
            return await locker.isLocked(by, { id: id, tenant: tenant, key: key, context: context });
        },
        incrLock: async (req) => {
            parseReq(req);
            return await locker.incr(by, { id: id, tenant: tenant, key: key, context: context });
        },
        unlock: () => {
            await locker.unlock({ id: id, tenant: tenant });
        }
    }
}

registratioLockHandler = (req, res, next) => {
    //Do not give a clue to the attacker that his ip is locked
    try {
        //Fake an error message, same as they get on an invalid input if input is not valid
        customers.validateRegistrationData(req);
    } catch (err) {
        return next(err);
    }
    //If input is valid, send them an error message corresponding to email in use without validating
    return next(new utils.httpError(400, req.translate('emailAlreadyInUse', [req.body.email])));
}
registration = ratelimiter(['ip', 'email'], 'registration-rate-limit', 'registration', 'auto', registratioLockHandler);

registrationRatelomiter.validate();
registrationRatelomiter.isLocked();
registrationRatelomiter.incrLock();
registrationRatelomiter.unlock();


loginLockHandler = (req, res, next) => {
    return next(new utils.httpError(401, req.translate('invalidCredentials')));
}

loginByIpRateLimiter = ratelimiter('ip', 'login-rate-limit', 'login', '', loginByIpHandler);
loginByEmailRateLimiter = ratelimiter('email', 'login-rate-limit', 'login', '', loginByIpHandler);
login = () => {
    return {

    }
}
