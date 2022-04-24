const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const https = require("https");


const questions = require("./questions.json");

const PORT = 8443;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));

const getResponse = (text, session, TTStext = text, session_state= {},card= {}) => {
  return {
    response: {
      text: text,
      tts: TTStext,
      card:card,
      end_session: false 
    },
    session: session,
    session_state: session_state,
    version: "1.0",
  };
};

app.use(bodyParser.json());



app.post("/skills", async (res, req) => {
    const request = res.body;
    const command = request.request.command;
    const session = request.session; 
    const wordTokens = request.request.nlu.tokens;
    var state = request.state.session
    console.log(command,state) 
        if ((wordTokens.includes("вездекод") | wordTokens.includes("вездеход")) && wordTokens.includes("баклажаны")) {
            return req.send(getResponse("Привет Вездекодерам!", session, "Привет Вездек+одерам"));
        }else if (command == "0"){
            return req.send(getResponse("Хорошо, тест завершён.", session,"Хорошо\n тест завершён.", session_state = {}));
        }else if (command == "тест"){
            return req.send(getResponse(`Я тебе задам 8 вопросов на тему IT,а затем подберу темы Вездекода в соответсвии с твоими ответами! Чтобы прекратить тест напиши цифру ноль\n\n${questions[0].question}`, session,`Я тебе задам 8 вопросов на тему ай ти\nа затем подберу темы Вездек+ода в соответсвии с твоими ответами! Чтобы прекратить тест напиши цифру ноль\n\n${questions[0].questionTTS}`, session_state = {
                current_question : 0,
                score: 0
            }));
        }else {  
            if (state?.current_question >= 0){
                if (state.current_question < questions.length-1){
                    if (questions[state.current_question].ans.includes(command)){
                        return req.send(getResponse(`Верно!\n${questions[state.current_question+1].question}`,session, `<speaker audio_vk_id=2000512003_456239519> Правильный ответ!\n\n\n ${questions[state.current_question+1].questionTTS}`, session_state = {
                            current_question : state.current_question+1,
                            score: state.score + 1
                        },{
                            "type":"BigImage",
                            "image_id":questions[state.current_question+1].img_id
                         }));
                    }else {
                        return req.send(getResponse(`Не правильно.\n${questions[state.current_question+1].question}`,session, `<speaker audio_vk_id=2000512003_456239518> Не правильно.\n\n\n ${questions[state.current_question+1].questionTTS}`, session_state = {
                            current_question : state.current_question+1,
                            score: state.score
                        },{
                            "type":"BigImage",
                            "image_id":questions[state.current_question+1].img_id
                        }));
                    }
                } else{ 
                    let themes,themesTTS;
                    if (questions[state.current_question].ans.includes(command)) state.score ++
                    if (state.score <= 2){
                        themes = "Маруся\nЧат-боты"
                        themesTTS = "Маруся\nЧат б+оты"
                    }else if (state.score > 2 && state.score <= 4){
                        themes = "Маруся\nЧат-боты\nVK Mini Apps\nGamedev"
                        themesTTS = "Маруся\nЧат б+оты\nVK Mini Apps\nGame dev"
                    }else if (state.score > 4 && state.score <= 6){
                        themes = "Маруся\nЧат-боты\nVK Mini Apps\nGamedev\nBack End"
                        themesTTS = "Маруся\nЧат б+оты\nVK Mini Apps\nGame dev\nBack End"
                    }else{
                        themes = "Маруся\nЧат-боты\nVK Mini Apps\nGamedev\nBack End\nJava\nMobile\nPHP"
                        themesTTS = "Маруся\nЧат б+оты\nVK Mini Apps\nGame dev\nBack End\nJava\nMobile\nПи эйч пи"
                    } 

                    return req.send({
                        response: {
                            text: `${questions[state.current_question].ans.includes(command) ? "Верно!" : "Не правильно."}\n\nТест завершён! У тебя ${state.score} ${state.score == 1 ? "верный ответ": "верных ответов"}. Советую тебе следующие темы Вездекода:\n${themes}`,
                            tts:  `${questions[state.current_question].ans.includes(command) ? "Верно!" : "Не правильно."}\n\n<speaker audio_vk_id=2000512003_456239517> Тест завершён!\nУ тебя ${state.score == 1 ? "один верный ответ": `${state.score} верных ответов`}.\n Советую тебе следующие темы Вездекода:\n${themesTTS}`,
                            commands: [
                                {
                                    "type":"BigImage",
                                    "image_id":457239017
                                },
                                {
                                    "type": "MiniApp",
                                    "url": "https://vk.com/app7923597",
                                } 
                            ],
                            end_session:true
                        },
                        session: session,
                        version: "1.0",
                      })
                }              
            }
        }
   
    req.send(getResponse("Я ещё не знаю такой команды.", session));
});


https.createServer({key: fs.readFileSync("server.key"),cert: fs.readFileSync("server.cert")},app)
.listen(PORT, function () {
    console.log(`Server listening ${PORT}`);
});
