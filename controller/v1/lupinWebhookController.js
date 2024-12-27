let async = require('async');
let axios = require('axios');
var FormData = require('form-data');

module.exports = (req, res) => {
    //console.log('getDiseaseOrganHabits------------->' + JSON.stringify(req.body));
    let Type = (typeof req.body.type != undefined) ? req.body.type + '' : '';
    let _City = (typeof req.body.city != undefined) ? req.body.city + '' : '';
    let _State = (typeof req.body.state != undefined) ? req.body.state + '' : '';

    let getLoginData = (done) => {
        var data = new FormData();
        data.append('username', 'Whatsapp');
        data.append('password', 'KHYFDHGHFGFDFGGFDGG');
        data.append('client', 'Whatsapp');
        var config = {
            method: 'post',
            url: 'http://20.193.244.108/HomeCollectionAPI/api/LoginAPI',
            headers: {
                ...data.getHeaders()
            },
            data: data
        };

        axios(config)
            .then(function (response) {
                // console.log('getLoginData response--------------------------->' + JSON.stringify(response.data));
                let authtoken = response.data.responseBody.attributes[0].attrvalue;

                done(null, authtoken);
            })
            .catch(function (error) {
                // console.log('getLoginData error--------------------------->' + JSON.stringify(error));
                done(error);
            });
    }
    let getData = (authtoken, done) => {
        // console.log('authtoken----------------->' + authtoken);
        var data = new FormData();
        data.append('Type', Type);
        var config = {
            method: 'post',
            url: 'http://20.193.244.108/HomeCollectionAPI/api/WhatsApp/GetOrgan_Disease_Habits',
            headers: {
                'Authorization': 'Bearer ' + authtoken,
                ...data.getHeaders()
            },
            data: data
        };

        axios(config)
            .then(function (response) {
                // let authtoken = response.data.responseBody.attributes[0].attrvalue;
                // console.log('getData response--------------------------->' + JSON.stringify(response.data));
                done(null, response.data, authtoken);
            })
            .catch(function (error) {
                //console.log('getData error--------------------------->' + JSON.stringify(error));
                done(error);

            });


    }


    let getAllstate = (response1, authtoken, done) => {
        //console.log('authtoken----------------->' + authtoken);
        var data = new FormData();
        data.append('State', _State);
        var config = {
            method: 'post',
            url: 'http://20.193.244.108/HomeCollectionAPI/api/WhatsApp/GetAllCity',
            headers: {
                'Authorization': 'Bearer ' + authtoken,
                ...data.getHeaders()
            },
            data: data
        };

        axios(config)
            .then(function (response) {
                // console.log('getAllstate response--------------------------->' + JSON.stringify(response.data));
                let isStateFound = 0;
                let City = response.data.responseBody;
                let State = response.data.responseBody;
                // let Type = response.data.responseBody;
                for (let i = 0; i < State.length; i++) {
                    let tempStateId = State[i].StateID;
                    let tempCityId = City[i].CityID;
                    let tempState = State[i].State;
                    let tempCity = City[i].City;
                    // let tempType = Type[i].Type;
                    tempState = tempState.replace(/ /g, '');
                    State = State.replace(/ /g, '');
                    City = City.replace(/ /g, '');
                    // Type = Type.replace(/ /g, '');
                    if (tempState.toLowerCase() == State.toLowerCase() && tempCity.toLowerCase() == City.toLowerCase()) {
                        isStateFound = 1;
                        let obj2 = {
                            cityid: tempCityId,
                            stateid: tempStateId
                        };


                        // obj2[''+Type+''] = response1.responseBody;
                        let disesaseArr = response1.responseBody;
                        let typeSmsContent = 'Please select below option\n';
                        for (let k = 0; k < disesaseArr.length; k++) {
                            typeSmsContent += (k + 1) + '. ' + disesaseArr[k].MappingName + '\n';
                        }
                        obj2['' + Type + ''] = typeSmsContent;
                        // done(null, obj2);
                        done(null, typeSmsContent);
                        break;
                    }
                }

                if (isStateFound == 0) {
                    done(null, 'No match found');
                }
            })
            .catch(function (error) {
                // console.log('getAllstate error--------------------------->' + JSON.stringify(error));
                done(error);
            });


    }


    async.waterfall([getLoginData, getData, getAllstate], (err, result) => {
        if (err) {
            console.log(JSON.stringify(err));
            res.send({
                code: 100,
                status: 'FAILED',
                data: "Something went wrong"
            });
        } else {
            let response = {
                "code": 200,
                "status": "success",
                "type": "text",
                "data": result


            };
            // console.log(JSON.stringify(response));
            res.status(200).json(response);
        }
    });
};